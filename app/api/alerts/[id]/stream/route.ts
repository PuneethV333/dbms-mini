import type { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/server/auth";
import { findOwned } from "@/lib/server/alerts";
import { apiHandler } from "@/lib/server/handler";
import { fail } from "@/lib/server/http";
import { limiterKey, rateLimit } from "@/lib/server/rate-limit";
import { sseResponse } from "@/lib/server/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Owner live-update stream. Clients refetch the alert on each `update` event. */
export async function GET(request: NextRequest, { params }: Params) {
  return apiHandler(async () => {
    const user = await getAuthUser(request);
    if (!user) return fail(401, "You are not signed in.");
    const limited = rateLimit(limiterKey(request, "alerts:stream", user.id), 60);
    if (!limited.ok) {
      return fail(429, "Too many requests — try again shortly.", {
        "Retry-After": String(limited.retryAfter),
      });
    }

    const { id } = await params;
    await findOwned(user.id, id);
    return sseResponse(request, `alert:${id}`);
  });
}
