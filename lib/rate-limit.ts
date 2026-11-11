import "server-only"

/**
 * Fixed-window, in-memory rate limiter. Good enough for a single instance;
 * swap for Redis/Upstash when running more than one server.
 */
const buckets = new Map<string, { count: number; resetAt: number }>()
const MAX_BUCKETS = 10_000
let lastSweep = 0

/** Drops expired windows so a stream of unique keys can't grow memory forever. */
function sweep(now: number) {
  if (now - lastSweep < 60_000 && buckets.size < MAX_BUCKETS) return
  lastSweep = now
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key)
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  sweep(now)
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfterSeconds: 0 }
  }
  bucket.count += 1
  if (bucket.count > limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) }
  }
  return { ok: true, retryAfterSeconds: 0 }
}
