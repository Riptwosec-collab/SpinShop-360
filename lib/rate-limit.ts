/**
 * Minimal in-memory rate limiter for a single Next.js server instance.
 *
 * PRODUCTION NOTE: in-memory state does not survive server restarts and
 * does not work across multiple serverless instances/regions (each Vercel
 * lambda gets its own memory). For real production traffic, swap this for
 * a shared store such as Upstash Redis + `@upstash/ratelimit`:
 *
 *   import { Ratelimit } from "@upstash/ratelimit";
 *   import { Redis } from "@upstash/redis";
 *   const ratelimit = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(5, "60 s") });
 *
 * The function signature below is intentionally compatible so that swap is
 * a one-file change.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodically sweep expired buckets so the Map doesn't grow unbounded on a
// long-lived server process.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 60_000).unref?.();

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * @param key Unique identifier for the caller + route, e.g. `login:1.2.3.4`
 * @param limit Max requests allowed within the window
 * @param windowMs Window size in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, limit, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= limit) {
    return { success: false, limit, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { success: true, limit, remaining: limit - existing.count, resetAt: existing.resetAt };
}

/** Route-specific limits used across the app's API routes. */
export const RATE_LIMITS = {
  login: { limit: 5, windowMs: 60_000 }, // 5 attempts / minute / IP
  coupon: { limit: 10, windowMs: 60_000 }, // 10 coupon checks / minute / IP
  review: { limit: 3, windowMs: 60_000 }, // 3 review submissions / minute / user
} as const;
