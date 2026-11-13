import type { NextRequest } from "next/server";
import { prisma } from "@/lib/server/db";
import { apiHandler } from "@/lib/server/handler";
import { fail, json } from "@/lib/server/http";
import { limiterKey, rateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return apiHandler(async () => {
    const limited = rateLimit(limiterKey(request, "health"), 60);
    if (!limited.ok) {
      return fail(429, "Too many requests — try again shortly.", {
        "Retry-After": String(limited.retryAfter),
      });
    }

    try {
      await prisma.$queryRaw`SELECT 1`;
      return json({ status: "ok", database: "connected", auth: "cookie" });
    } catch (error) {
      console.error("[health] database check failed", error);
      return fail(503, "Database unavailable.");
    }
  });
}
