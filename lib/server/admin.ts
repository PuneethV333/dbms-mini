import type { AdminAlertRowDto, AdminReportDto, AlertStatus } from "@/lib/types";
import { prisma } from "./db";

export interface AdminAlertsFilter {
  status?: AlertStatus;
  from?: Date;
  to?: Date;
  userId?: string;
  take: number;
  skip: number;
}

export async function listAlerts(filter: AdminAlertsFilter): Promise<AdminAlertRowDto[]> {
  const rows = await prisma.alert.findMany({
    where: {
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.userId ? { userId: filter.userId } : {}),
      ...(filter.from || filter.to
        ? {
            triggeredAt: {
              ...(filter.from ? { gte: filter.from } : {}),
              ...(filter.to ? { lte: filter.to } : {}),
            },
          }
        : {}),
    },
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { locations: true } },
      activityLogs: {
        where: { eventType: "acknowledged" },
        select: { timestamp: true },
        orderBy: { timestamp: "asc" },
        take: 1,
      },
      notificationDeliveries: { select: { status: true } },
    },
    orderBy: { triggeredAt: "desc" },
    take: filter.take,
    skip: filter.skip,
  });

  return rows.map((row) => {
    const sent = row.notificationDeliveries.filter((delivery) => delivery.status === "sent").length;
    const failed = row.notificationDeliveries.filter(
      (delivery) => delivery.status === "failed",
    ).length;

    return {
      id: row.id,
      status: row.status as AlertStatus,
      userName: row.user.name,
      userEmail: row.user.email,
      triggeredAt: row.triggeredAt.toISOString(),
      acknowledgedAt: row.activityLogs[0]?.timestamp.toISOString() ?? null,
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
      locationCount: row._count.locations,
      deliveriesSent: sent,
      deliveriesFailed: failed,
    };
  });
}

/** SQLite-compatible aggregate KPIs (the original used Postgres date_trunc/interval). */
export async function getReports(): Promise<AdminReportDto> {
  const [alerts, ackLogs] = await Promise.all([
    prisma.alert.findMany({
      select: { id: true, status: true, triggeredAt: true, resolvedAt: true },
    }),
    prisma.activityLog.findMany({
      where: { eventType: "acknowledged" },
      select: { alertId: true, timestamp: true },
    }),
  ]);

  const total = alerts.length;
  const resolved = alerts.filter((alert) => alert.status === "resolved").length;
  const acknowledged = alerts.filter(
    (alert) => alert.status === "acknowledged" || alert.status === "resolved",
  ).length;

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dayCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const activeNow = alerts.filter(
    (alert) =>
      (alert.status === "sent" || alert.status === "acknowledged") &&
      alert.triggeredAt >= dayCutoff,
  ).length;

  const perDay = new Map<string, number>();
  for (const alert of alerts) {
    if (alert.triggeredAt < cutoff) continue;
    const day = alert.triggeredAt.toISOString().slice(0, 10);
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }
  const alertsPerDay = [...perDay.entries()]
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => a.day.localeCompare(b.day));

  const byId = new Map(alerts.map((alert) => [alert.id, alert]));

  const ackDurations = ackLogs.flatMap((log) => {
    const alert = byId.get(log.alertId);
    if (!alert) return [];
    return [(log.timestamp.getTime() - alert.triggeredAt.getTime()) / 60_000];
  });

  const resolveDurations = alerts.flatMap((alert) =>
    alert.resolvedAt
      ? [(alert.resolvedAt.getTime() - alert.triggeredAt.getTime()) / 60_000]
      : [],
  );

  const average = (values: number[]): number | null =>
    values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;

  return {
    totals: { alerts: total, acknowledged, resolved },
    activeNow,
    ackRate: total === 0 ? 0 : acknowledged / total,
    alertsPerDay,
    avgAcknowledgeMinutes: average(ackDurations),
    avgResolveMinutes: average(resolveDurations),
  };
}
