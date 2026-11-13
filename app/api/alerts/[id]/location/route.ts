import type { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/server/auth";
import { addLocation } from "@/lib/server/alerts";
import { apiHandler } from "@/lib/server/handler";
import { fail, json, parseBody } from "@/lib/server/http";
import { limiterKey, rateLimit } from "@/lib/server/rate-limit";
import { updateLocationSchema } from "@/lib/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** REST location ping (the original used REST as the Socket.IO fallback). */
export async function POST(request: NextRequest, { params }: Params) {
  return apiHandler(async () => {
    const user = await getAuthUser(request);
    if (!user) return fail(401, "You are not signed in.");
    const limited = rateLimit(limiterKey(request, "alerts:location", user.id), 60);
    if (!limited.ok) {
      return fail(429, "Too many requests — try again shortly.", {
        "Retry-After": String(limited.retryAfter),
      });
    }

    const { id } = await params;
    const parsed = await parseBody(request, updateLocationSchema);
    if (!parsed.ok) return parsed.response;
    return json(await addLocation(user.id, id, parsed.data), 201);
  });
}
