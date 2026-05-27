type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

/** Checks and increments an in-memory sliding-window counter for the given key; returns ok: false with remaining: 0 when the limit is reached. */
export function checkRateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now()
  const current = buckets.get(key)

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (current.count >= limit) {
    return { ok: false, remaining: 0, resetAt: current.resetAt }
  }

  current.count += 1
  return { ok: true, remaining: limit - current.count, resetAt: current.resetAt }
}
