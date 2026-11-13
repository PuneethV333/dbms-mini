import type { NextRequest } from "next/server";
import { apiHandler } from "@/lib/server/handler";
import { fail, json } from "@/lib/server/http";
import { limiterKey, rateLimit } from "@/lib/server/rate-limit";
import { getByToken } from "@/lib/server/tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  return apiHandler(async () => {
    const limited = rateLimit(limiterKey(request, "tracking:get"), 20);
    if (!limited.ok) {
      return fail(429, "Too many requests — try again shortly.", {
        "Retry-After": String(limited.retryAfter),
      });
    }

    const { token } = await params;
    return json(await getByToken(token));
  });
}
