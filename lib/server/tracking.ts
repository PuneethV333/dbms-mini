import type { Alert, AlertLocation } from "@prisma/client";
import type { AlertTrackingDto } from "@/lib/types";
import { prisma } from "./db";
import { ApiError } from "./errors";
import { publish } from "./events";

type TrackingAlert = Alert & {
  user: { name: string };
  lastLocation: AlertLocation | null;
  _count: { locations: number };
};

function toLocationDto(location: AlertLocation) {
  return {
    id: location.id,
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    recordedAt: location.recordedAt.toISOString(),
  };
}

function toTrackingDto(alert: TrackingAlert): AlertTrackingDto {
  return {
    id: alert.id,
    status: alert.status as AlertTrackingDto["status"],
    userName: alert.user.name,
    triggeredAt: alert.triggeredAt.toISOString(),
    resolvedAt: alert.resolvedAt?.toISOString() ?? null,
    lastLocation: alert.lastLocation ? toLocationDto(alert.lastLocation) : null,
    locationCount: alert._count.locations,
  };
}

export async function getByToken(token: string): Promise<AlertTrackingDto> {
  const alert = await prisma.alert.findUnique({
    where: { trackingToken: token },
    include: {
      user: { select: { name: true } },
      lastLocation: true,
      _count: { select: { locations: true } },
    },
  });
  if (!alert) throw new ApiError(404, "This tracking link is invalid or expired.");
  return toTrackingDto(alert);
}

/** A contact acknowledges the alert (only possible while `sent`). */
export async function acknowledge(token: string): Promise<AlertTrackingDto> {
  const alert = await prisma.alert.findUnique({ where: { trackingToken: token } });
  if (!alert) throw new ApiError(404, "This tracking link is invalid or expired.");
  if (alert.status === "resolved") throw new ApiError(400, "This alert is already resolved.");
  if (alert.status === "acknowledged") {
    throw new ApiError(400, "This alert is already acknowledged.");
  }

  await prisma.alert.update({
    where: { id: alert.id },
    data: { status: "acknowledged" },
  });
  await prisma.activityLog.create({
    data: { alertId: alert.id, eventType: "acknowledged", actor: "contact" },
  });

  publish([`alert:${alert.id}`, `track:${alert.trackingToken}`], "status");
  return getByToken(token);
}

export async function findAlertIdByToken(token: string): Promise<Alert | null> {
  return prisma.alert.findUnique({ where: { trackingToken: token } });
}
