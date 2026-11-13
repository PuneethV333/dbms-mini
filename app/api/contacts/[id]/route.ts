import { NextResponse, type NextRequest } from "next/server";
import { getAuthUser } from "@/lib/server/auth";
import { removeContact, updateContact } from "@/lib/server/contacts";
import { apiHandler } from "@/lib/server/handler";
import { fail, json, parseBody } from "@/lib/server/http";
import { limiterKey, rateLimit } from "@/lib/server/rate-limit";
import { contactUpdateSchema } from "@/lib/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  return apiHandler(async () => {
    const user = await getAuthUser(request);
    if (!user) return fail(401, "You are not signed in.");
    const limited = rateLimit(limiterKey(request, "contacts:update", user.id), 10);
    if (!limited.ok) {
      return fail(429, "Too many requests — try again shortly.", {
        "Retry-After": String(limited.retryAfter),
      });
    }

    const { id } = await params;
    const parsed = await parseBody(request, contactUpdateSchema);
    if (!parsed.ok) return parsed.response;
    return json(await updateContact(user.id, id, parsed.data));
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  return apiHandler(async () => {
    const user = await getAuthUser(request);
    if (!user) return fail(401, "You are not signed in.");
    const limited = rateLimit(limiterKey(request, "contacts:delete", user.id), 10);
    if (!limited.ok) {
      return fail(429, "Too many requests — try again shortly.", {
        "Retry-After": String(limited.retryAfter),
      });
    }

    const { id } = await params;
    await removeContact(user.id, id);
    return new NextResponse(null, { status: 204 });
  });
}
