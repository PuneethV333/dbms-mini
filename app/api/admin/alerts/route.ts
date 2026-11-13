import type { NextRequest } from "next/server";
import { listAlerts } from "@/lib/server/admin";
import { getAuthUser } from "@/lib/server/auth";
import { apiHandler } from "@/lib/server/handler";
import { fail, json, parseQuery } from "@/lib/server/http";
import { limiterKey, rateLimit } from "@/lib/server/rate-limit";
import { adminAlertsQuerySchema } from "@/lib/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return apiHandler(async () => {
    const user = await getAuthUser(request);
    if (!user) return fail(401, "You are not signed in.");
    if (!user.isAdmin) return fail(403, "Admin access required.");

    const limited = rateLimit(limiterKey(request, "admin:alerts", user.id), 30);
    if (!limited.ok) {
      return fail(429, "Too many requests — try again shortly.", {
        "Retry-After": String(limited.retryAfter),
      });
    }

    const parsed = parseQuery(new URL(request.url), adminAlertsQuerySchema);
    if (!parsed.ok) return parsed.response;

    return json(
      await listAlerts({
        status: parsed.data.status,
        from: parsed.data.from ? new Date(parsed.data.from) : undefined,
        to: parsed.data.to ? new Date(parsed.data.to) : undefined,
        userId: parsed.data.userId,
        take: parsed.data.take ?? 50,
        skip: parsed.data.skip ?? 0,
      }),
    );
  });
}
