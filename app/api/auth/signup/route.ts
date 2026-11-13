import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { isListedAdmin, signInResponse, toUserDto } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";
import { isUniqueConstraintError } from "@/lib/server/errors";
import { apiHandler } from "@/lib/server/handler";
import { fail, json, parseBody } from "@/lib/server/http";
import { limiterKey, rateLimit } from "@/lib/server/rate-limit";
import { signupSchema } from "@/lib/server/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return apiHandler(async () => {
    const limited = rateLimit(limiterKey(request, "auth:signup"), 10);
    if (!limited.ok) {
      return fail(429, "Too many requests — try again shortly.", {
        "Retry-After": String(limited.retryAfter),
      });
    }

    const parsed = await parseBody(request, signupSchema);
    if (!parsed.ok) return parsed.response;

    const { name, email, password } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return fail(409, "An account with this email already exists.");

    try {
      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash: await bcrypt.hash(password, 10),
          isAdmin: isListedAdmin(email),
        },
      });
      const response = json(toUserDto(user), 201);
      return signInResponse(response, user);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return fail(409, "An account with this email already exists.");
      }
      throw error;
    }
  });
}
