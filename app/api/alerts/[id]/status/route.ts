import type { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/server/auth";
import { updateStatus } from "@/lib/server/alerts";
import { apiHandler } from "@/lib/server/handler";
import { fail, json, parseBody } from "@/lib/server/http";
import { limiterKey, rateLimit } from "@/lib/server/rate-limit";
import { updateStatusSchema } from "@/lib/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  return apiHandler(async () => {
    const user = await getAuthUser(request);
    if (!user) return fail(401, "You are not signed in.");
    const limited = rateLimit(limiterKey(request, "alerts:status", user.id), 20);
    if (!limited.ok) {
      return fail(429, "Too many requests — try again shortly.", {
        "Retry-After": String(limited.retryAfter),
      });
    }

    const { id } = await params;
    const parsed = await parseBody(request, updateStatusSchema);
    if (!parsed.ok) return parsed.response;
    return json(await updateStatus(user.id, id, parsed.data.status));
  });
}
