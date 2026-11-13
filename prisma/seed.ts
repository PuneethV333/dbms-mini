import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Password123!";

async function main() {
  // Idempotent: wipe in FK order, then re-seed.
  await prisma.notificationDelivery.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.alertLocation.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.emergencyContact.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const t0 = new Date("2026-08-13T08:00:00Z");

  const priya = await prisma.user.create({
    data: {
      email: "priya@example.com",
      passwordHash,
      name: "Priya Sharma",
      phone: "+919876543210",
      contacts: {
        create: [
          {
            name: "Sunita Sharma",
            phone: "+919812345001",
            email: "sunita.mum@example.com",
            relationship: "Mother",
          },
          {
            name: "Rahul Sharma",
            phone: "+919812345002",
            email: "rahul.sharma@example.com",
            relationship: "Brother",
          },
          {
            name: "Meera Iyer",
            phone: "+919812345003",
            email: "meera.iyer@example.com",
            relationship: "Friend",
          },
          {
            name: "Vikram Rao",
            phone: "+919812345004",
            email: "vikram.rao@example.com",
            relationship: "Colleague",
          },
          {
            name: "Ananya Das",
            phone: "+919812345005",
            email: "ananya.das@example.com",
            relationship: "Friend",
          },
        ],
      },
    },
    include: { contacts: true },
  });

  const arjun = await prisma.user.create({
    data: {
      email: "arjun@example.com",
      passwordHash,
      name: "Arjun Mehta",
      phone: "+919811223344",
      contacts: {
        create: [
          {
            name: "Kavya Mehta",
            phone: "+919811998877",
            email: "kavya.mehta@example.com",
            relationship: "Sister",
          },
        ],
      },
    },
  });

  await prisma.user.create({
    data: {
      email: "admin@bsafe.test",
      passwordHash,
      name: "Safety Admin",
      isAdmin: true,
      contacts: {
        create: [
          {
            name: "Ops Desk",
            phone: "+919800000001",
            email: "ops@bsafe.test",
            relationship: "Monitoring",
          },
        ],
      },
    },
  });

  // Priya — resolved alert with a short movement trail.
  const resolvedAlert = await prisma.alert.create({
    data: {
      userId: priya.id,
      status: "resolved",
      triggeredAt: t0,
      resolvedAt: new Date(t0.getTime() + 42 * 60 * 1000),
    },
  });

  const base = { latitude: 12.9719, longitude: 77.6412 };
  let lastResolvedLocationId: string | null = null;
  for (let i = 0; i < 5; i++) {
    const location = await prisma.alertLocation.create({
      data: {
        alertId: resolvedAlert.id,
        latitude: base.latitude + i * 0.0004,
        longitude: base.longitude + i * 0.0003,
        accuracy: 12 + i,
        recordedAt: new Date(t0.getTime() + i * 15 * 1000),
      },
    });
    lastResolvedLocationId = location.id;
  }
  if (lastResolvedLocationId) {
    await prisma.alert.update({
      where: { id: resolvedAlert.id },
      data: { lastLocationId: lastResolvedLocationId },
    });
  }

  await prisma.activityLog.createMany({
    data: [
      { alertId: resolvedAlert.id, eventType: "triggered", actor: `user:${priya.id}`, timestamp: t0 },
      {
        alertId: resolvedAlert.id,
        eventType: "acknowledged",
        actor: "contact",
        timestamp: new Date(t0.getTime() + 5 * 60 * 1000),
      },
      {
        alertId: resolvedAlert.id,
        eventType: "resolved",
        actor: `user:${priya.id}`,
        timestamp: new Date(t0.getTime() + 42 * 60 * 1000),
      },
    ],
  });

  await prisma.notificationDelivery.createMany({
    data: priya.contacts
      .filter((contact) => contact.email)
      .map((contact) => ({
        alertId: resolvedAlert.id,
        contactId: contact.id,
        channel: "email",
        status: "sent",
        attempts: 1,
        sentAt: new Date(t0.getTime() + 10 * 1000),
      })),
  });

  // Priya — acknowledged (active) alert.
  const pendingAlert = await prisma.alert.create({
    data: {
      userId: priya.id,
      status: "acknowledged",
      triggeredAt: new Date(t0.getTime() + 60 * 60 * 1000),
    },
  });

  let lastPendingLocationId: string | null = null;
  for (let i = 0; i < 3; i++) {
    const location = await prisma.alertLocation.create({
      data: {
        alertId: pendingAlert.id,
        latitude: 12.9719 - i * 0.0003,
        longitude: 77.6412 + i * 0.0002,
        accuracy: 10,
        recordedAt: new Date(t0.getTime() + 60 * 60 * 1000 + i * 15 * 1000),
      },
    });
    lastPendingLocationId = location.id;
  }
  if (lastPendingLocationId) {
    await prisma.alert.update({
      where: { id: pendingAlert.id },
      data: { lastLocationId: lastPendingLocationId },
    });
  }

  await prisma.activityLog.createMany({
    data: [
      {
        alertId: pendingAlert.id,
        eventType: "triggered",
        actor: `user:${priya.id}`,
        timestamp: new Date(t0.getTime() + 60 * 60 * 1000),
      },
      {
        alertId: pendingAlert.id,
        eventType: "acknowledged",
        actor: "contact",
        timestamp: new Date(t0.getTime() + 65 * 60 * 1000),
      },
    ],
  });

  await prisma.notificationDelivery.createMany({
    data: priya.contacts
      .filter((contact) => contact.email)
      .map((contact, index) => ({
        alertId: pendingAlert.id,
        contactId: contact.id,
        channel: "email",
        status: index === 0 ? "failed" : "sent",
        attempts: index === 0 ? 3 : 1,
        lastError: index === 0 ? "SMTP not configured (demo seed)." : null,
        sentAt: index === 0 ? null : new Date(t0.getTime() + 70 * 60 * 1000),
      })),
  });

  // Arjun — sent (fresh) alert, no ack/resolve yet.
  const freshAlert = await prisma.alert.create({
    data: {
      userId: arjun.id,
      status: "sent",
      triggeredAt: new Date(t0.getTime() + 90 * 60 * 1000),
    },
  });

  let lastFreshLocationId: string | null = null;
  for (let i = 0; i < 2; i++) {
    const location = await prisma.alertLocation.create({
      data: {
        alertId: freshAlert.id,
        latitude: 12.9352 + i * 0.0002,
        longitude: 77.6245 + i * 0.0002,
        accuracy: 8,
        recordedAt: new Date(t0.getTime() + 90 * 60 * 1000 + i * 15 * 1000),
      },
    });
    lastFreshLocationId = location.id;
  }
  if (lastFreshLocationId) {
    await prisma.alert.update({
      where: { id: freshAlert.id },
      data: { lastLocationId: lastFreshLocationId },
    });
  }

  await prisma.activityLog.create({
    data: {
      alertId: freshAlert.id,
      eventType: "triggered",
      actor: `user:${arjun.id}`,
      timestamp: new Date(t0.getTime() + 90 * 60 * 1000),
    },
  });

  const summary = {
    users: await prisma.user.count(),
    contacts: await prisma.emergencyContact.count(),
    alerts: await prisma.alert.count(),
    locations: await prisma.alertLocation.count(),
    activityLogs: await prisma.activityLog.count(),
    deliveries: await prisma.notificationDelivery.count(),
    demoPassword: DEMO_PASSWORD,
  };
  console.log("Seeded:", summary);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
