import type { NextRequest } from "next/server";

interface Bucket {
  count: number;
  resetAt: number;
}

const globalForRateLimit = globalThis as unknown as {
  bsafeRateBuckets?: Map<string, Bucket>;
};

const buckets = (globalForRateLimit.bsafeRateBuckets ??= new Map<string, Bucket>());

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfter: number;
}

/**
 * In-process fixed-window limiter. Redis is intentionally not required for this
 * single-process build; the same per-route limits from the original API apply.
 */
export function rateLimit(key: string, limit: number, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  return { ok: true, remaining: limit - bucket.count, retryAfter: 0 };
}

export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "local";
}

export function limiterKey(
  request: NextRequest,
  scope: string,
  userId?: string | null,
): string {
  return userId ? `user:${userId}:${scope}` : `ip:${clientIp(request)}:${scope}`;
}
