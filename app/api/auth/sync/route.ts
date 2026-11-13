import type { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/server/auth";
import { apiHandler } from "@/lib/server/handler";
import { fail, json } from "@/lib/server/http";
import { limiterKey, rateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Compatibility route: local cookie auth keeps the local row in sync on every call. */
export async function POST(request: NextRequest) {
  return apiHandler(async () => {
    const user = await getAuthUser(request);
    const limited = rateLimit(limiterKey(request, "auth:sync", user?.id), 10);
    if (!limited.ok) {
      return fail(429, "Too many requests — try again shortly.", {
        "Retry-After": String(limited.retryAfter),
      });
    }
    if (!user) return fail(401, "You are not signed in.");
    return json(user);
  });
}
