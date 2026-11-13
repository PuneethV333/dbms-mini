import type { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/server/auth";
import { apiHandler } from "@/lib/server/handler";
import { fail, json } from "@/lib/server/http";
import { getStatus } from "@/lib/server/notifications";
import { limiterKey, rateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ alertId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  return apiHandler(async () => {
    const user = await getAuthUser(request);
    if (!user) return fail(401, "You are not signed in.");
    const limited = rateLimit(limiterKey(request, "notifications:status", user.id), 30);
    if (!limited.ok) {
      return fail(429, "Too many requests — try again shortly.", {
        "Retry-After": String(limited.retryAfter),
      });
    }

    const { alertId } = await params;
    return json(await getStatus(user.id, alertId));
  });
}
