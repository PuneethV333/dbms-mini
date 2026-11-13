import type { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/server/auth";
import { getAlert } from "@/lib/server/alerts";
import { apiHandler } from "@/lib/server/handler";
import { fail, json } from "@/lib/server/http";
import { limiterKey, rateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  return apiHandler(async () => {
    const user = await getAuthUser(request);
    if (!user) return fail(401, "You are not signed in.");
    const limited = rateLimit(limiterKey(request, "alerts:get", user.id), 30);
    if (!limited.ok) {
      return fail(429, "Too many requests — try again shortly.", {
        "Retry-After": String(limited.retryAfter),
      });
    }

    const { id } = await params;
    return json(await getAlert(user.id, id));
  });
}
