import type { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/server/auth";
import { createContact, listContacts } from "@/lib/server/contacts";
import { apiHandler } from "@/lib/server/handler";
import { fail, json, parseBody } from "@/lib/server/http";
import { limiterKey, rateLimit } from "@/lib/server/rate-limit";
import { contactCreateSchema } from "@/lib/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return apiHandler(async () => {
    const user = await getAuthUser(request);
    if (!user) return fail(401, "You are not signed in.");
    const limited = rateLimit(limiterKey(request, "contacts:list", user.id), 30);
    if (!limited.ok) {
      return fail(429, "Too many requests — try again shortly.", {
        "Retry-After": String(limited.retryAfter),
      });
    }
    return json(await listContacts(user.id));
  });
}

export async function POST(request: NextRequest) {
  return apiHandler(async () => {
    const user = await getAuthUser(request);
    if (!user) return fail(401, "You are not signed in.");
    const limited = rateLimit(limiterKey(request, "contacts:create", user.id), 10);
    if (!limited.ok) {
      return fail(429, "Too many requests — try again shortly.", {
        "Retry-After": String(limited.retryAfter),
      });
    }

    const parsed = await parseBody(request, contactCreateSchema);
    if (!parsed.ok) return parsed.response;
    return json(await createContact(user.id, parsed.data), 201);
  });
}
