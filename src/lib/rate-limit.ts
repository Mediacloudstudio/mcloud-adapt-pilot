// Database-backed rate limiting (PART 53 — brute-force login protection).
// See the RateLimitAttempt model comment in prisma/schema.prisma for why
// this isn't an in-memory counter.

import { db } from "@/lib/db";

type RateLimitOptions = {
  /** Maximum attempts allowed inside the window. */
  maxAttempts: number;
  /** Window size in milliseconds. */
  windowMs: number;
};

export type RateLimitResult = {
  blocked: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/** Checks whether `key` has exceeded its attempt budget. Does not record a new attempt. */
export async function checkRateLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - options.windowMs);

  const count = await db.rateLimitAttempt.count({
    where: { key, createdAt: { gte: windowStart } },
  });

  return {
    blocked: count >= options.maxAttempts,
    remaining: Math.max(0, options.maxAttempts - count),
    retryAfterSeconds: Math.ceil(options.windowMs / 1000),
  };
}

/** Records one attempt against `key`. Call this on every attempt (success or failure) that should count toward the limit. */
export async function recordAttempt(key: string): Promise<void> {
  await db.rateLimitAttempt.create({ data: { key } });
}

/**
 * Opportunistic cleanup of attempts older than `olderThanMs`. Cheap enough
 * to call inline after a rate-limit check rather than needing a cron job —
 * this table is small and self-limiting (old rows stop mattering once
 * they age out of every window, but stay around and grow storage unless
 * something eventually prunes them).
 */
export async function pruneOldAttempts(olderThanMs = 24 * 60 * 60 * 1000): Promise<void> {
  await db.rateLimitAttempt.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - olderThanMs) } },
  });
}
