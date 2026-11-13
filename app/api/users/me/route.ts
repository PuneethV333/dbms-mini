import type { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/server/auth";
import { apiHandler } from "@/lib/server/handler";
import { fail, json, parseBody } from "@/lib/server/http";
import { limiterKey, rateLimit } from "@/lib/server/rate-limit";
import { getProfile, updateProfile } from "@/lib/server/users";
import { updateUserSchema } from "@/lib/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return apiHandler(async () => {
    const user = await getAuthUser(request);
    if (!user) return fail(401, "You are not signed in.");
    const limited = rateLimit(limiterKey(request, "users:me:get", user.id), 30);
    if (!limited.ok) {
      return fail(429, "Too many requests — try again shortly.", {
        "Retry-After": String(limited.retryAfter),
      });
    }
    return json(await getProfile(user.id));
  });
}

export async function PATCH(request: NextRequest) {
  return apiHandler(async () => {
    const user = await getAuthUser(request);
    if (!user) return fail(401, "You are not signed in.");
    const limited = rateLimit(limiterKey(request, "users:me:patch", user.id), 10);
    if (!limited.ok) {
      return fail(429, "Too many requests — try again shortly.", {
        "Retry-After": String(limited.retryAfter),
      });
    }

    const parsed = await parseBody(request, updateUserSchema);
    if (!parsed.ok) return parsed.response;
    return json(await updateProfile(user.id, parsed.data));
  });
}
