import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { isListedAdmin, signInResponse, toUserDto } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";
import { apiHandler } from "@/lib/server/handler";
import { fail, json, parseBody } from "@/lib/server/http";
import { limiterKey, rateLimit } from "@/lib/server/rate-limit";
import { signinSchema } from "@/lib/server/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return apiHandler(async () => {
    const limited = rateLimit(limiterKey(request, "auth:signin"), 10);
    if (!limited.ok) {
      return fail(429, "Too many requests — try again shortly.", {
        "Retry-After": String(limited.retryAfter),
      });
    }

    const parsed = await parseBody(request, signinSchema);
    if (!parsed.ok) return parsed.response;

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return fail(401, "Invalid email or password.");
    }

    const isAdmin = user.isAdmin || isListedAdmin(user.email);
    const current = isAdmin && !user.isAdmin
      ? await prisma.user.update({ where: { id: user.id }, data: { isAdmin: true } })
      : user;

    const response = json(toUserDto(current));
    return signInResponse(response, current);
  });
}
