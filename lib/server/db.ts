import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  bsafePrisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.bsafePrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.bsafePrisma = prisma;
}
