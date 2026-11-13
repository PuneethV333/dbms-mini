import type { NextRequest } from "next/server";
import { clearSessionCookie } from "@/lib/server/auth";
import { apiHandler } from "@/lib/server/handler";
import { fail, json } from "@/lib/server/http";
import { limiterKey, rateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return apiHandler(async () => {
    const limited = rateLimit(limiterKey(request, "auth:signout"), 30);
    if (!limited.ok) {
      return fail(429, "Too many requests — try again shortly.", {
        "Retry-After": String(limited.retryAfter),
      });
    }
    return clearSessionCookie(json({ ok: true }));
  });
}
