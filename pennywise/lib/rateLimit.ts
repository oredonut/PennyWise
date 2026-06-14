// ============================================================
// Simple in-memory sliding-window rate limiter. No external deps.
//
// NOTE: state lives in this process's memory. On a multi-instance
// or serverless deploy each instance keeps its own counters, so the
// effective limit is (max × instances) and counters reset on cold
// start. This is an abuse-dampener, not a distributed hard limit —
// use a shared store (e.g. Redis/Upstash) if you need global limits.
// ============================================================

type RateLimitStore = Map<string, { count: number; resetAt: number }>

export function createRateLimiter(config: {
  windowMs: number // time window in milliseconds
  max: number // max requests per window
}) {
  const store: RateLimitStore = new Map()

  return function rateLimit(identifier: string): {
    allowed: boolean
    remaining: number
    resetAt: number
  } {
    const now = Date.now()
    const entry = store.get(identifier)

    if (!entry || now > entry.resetAt) {
      store.set(identifier, {
        count: 1,
        resetAt: now + config.windowMs,
      })
      return { allowed: true, remaining: config.max - 1, resetAt: now + config.windowMs }
    }

    if (entry.count >= config.max) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt }
    }

    entry.count++
    return { allowed: true, remaining: config.max - entry.count, resetAt: entry.resetAt }
  }
}

// Shared limiters.
export const standardLimiter = createRateLimiter({
  windowMs: 60_000, // 1 minute
  max: 100,
})

export const ocrLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 10,
})

export const authLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 10,
})
