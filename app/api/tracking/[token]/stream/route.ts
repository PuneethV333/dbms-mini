import type { NextRequest } from "next/server";
import { apiHandler } from "@/lib/server/handler";
import { fail } from "@/lib/server/http";
import { limiterKey, rateLimit } from "@/lib/server/rate-limit";
import { sseResponse } from "@/lib/server/sse";
import { findAlertIdByToken } from "@/lib/server/tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

/** Public tokenized live-update stream (no internal ids are emitted). */
export async function GET(request: NextRequest, { params }: Params) {
  return apiHandler(async () => {
    const limited = rateLimit(limiterKey(request, "tracking:stream"), 60);
    if (!limited.ok) {
      return fail(429, "Too many requests — try again shortly.", {
        "Retry-After": String(limited.retryAfter),
      });
    }

    const { token } = await params;
    const alert = await findAlertIdByToken(token);
    if (!alert) return fail(404, "This tracking link is invalid or expired.");
    return sseResponse(request, `track:${token}`);
  });
}
