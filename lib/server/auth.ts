import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";
import type { User } from "@prisma/client";
import { prisma } from "./db";
import {
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE,
  verifySessionToken,
} from "./jwt";
import type { UserDto } from "@/lib/types";

export { SESSION_COOKIE };

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function getAuthUser(request: NextRequest): Promise<UserDto | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const claims = await verifySessionToken(token);
  if (!claims) return null;
  const user = await prisma.user.findUnique({ where: { id: claims.sub } });
  return user ? toUserDto(user) : null;
}

export async function getAuthUserId(request: NextRequest): Promise<string | null> {
  const user = await getAuthUser(request);
  return user?.id ?? null;
}

export async function signInResponse<T extends NextResponse>(
  response: T,
  user: { id: string; email: string; name: string; isAdmin: boolean },
): Promise<T> {
  const token = await createSessionToken(user);
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}

export function clearSessionCookie<T extends NextResponse>(response: T): T {
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}

/** Emails in ADMIN_EMAILS are promoted to admin on signup/sign-in. */
export function isListedAdmin(email: string): boolean {
  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.trim().toLowerCase());
}
