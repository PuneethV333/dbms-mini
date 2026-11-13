import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "bsafe_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export interface SessionClaims {
  sub: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

const DEFAULT_SECRET = "bsafe-dev-only-secret-change-me-32chars";

function secretKey(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET || DEFAULT_SECRET);
}

export async function createSessionToken(user: {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}): Promise<string> {
  return new SignJWT({ email: user.email, name: user.name, isAdmin: user.isAdmin })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string") return null;
    return {
      sub: payload.sub,
      email: typeof payload.email === "string" ? payload.email : "",
      name: typeof payload.name === "string" ? payload.name : "",
      isAdmin: payload.isAdmin === true,
    };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
