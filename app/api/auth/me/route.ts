import type { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/server/auth";
import { apiHandler } from "@/lib/server/handler";
import { fail, json } from "@/lib/server/http";
import { limiterKey, rateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return apiHandler(async () => {
    const user = await getAuthUser(request);
    const limited = rateLimit(limiterKey(request, "auth:me", user?.id), 30);
    if (!limited.ok) {
      return fail(429, "Too many requests — try again shortly.", {
        "Retry-After": String(limited.retryAfter),
      });
    }
    if (!user) return fail(401, "You are not signed in.");
    return json(user);
  });
}
