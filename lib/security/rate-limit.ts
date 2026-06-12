import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

type FallbackMode = 'open' | 'closed'
type RateLimitOptions = {
  key: string
  identifier: string
  limit: number
  window: `${number} ${'ms' | 's' | 'm' | 'h' | 'd'}` | `${number}${'ms' | 's' | 'm' | 'h' | 'd'}`
  fallback: FallbackMode
}
type MemoryBucket = { count: number; resetAt: number }
type RateLimitPass = {
  ok: true
  headers: Headers
  remaining: number
  resetAt: number
  limit: number
}
type RateLimitBlock = { ok: false; response: NextResponse }

const memoryBuckets = new Map<string, MemoryBucket>()
const limiters = new Map<string, Ratelimit>()

export const RATE_LIMITS = {
  auth:         { limit: 10, window: '1 m', fallback: 'closed' },
  registerIp:   { limit: 5,  window: '1 m', fallback: 'closed' },
  registerEmail:{ limit: 5,  window: '1 m', fallback: 'closed' },
  resetIp:      { limit: 3,  window: '1 m', fallback: 'closed' },
  resetEmail:   { limit: 1,  window: '2 m', fallback: 'closed' },
  chat:         { limit: 60, window: '1 m', fallback: 'open' },
  notes:        { limit: 100, window: '1 m', fallback: 'open' },
  ai:           { limit: 20, window: '1 m', fallback: 'closed' },
  coach:        { limit: 60, window: '1 m', fallback: 'open' },
  health:       { limit: 60, window: '1 m', fallback: 'open' },
  // V1 keeps normal Apple Health sync at 60/min; this preset is reserved for a future explicit initial_sync mode.
  healthInitialSync: { limit: 300, window: '1 m', fallback: 'open' },
} as const

function isProduction() {
  return process.env.NODE_ENV === 'production'
}

export function getClientIp(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || req.headers.get('x-real-ip') || 'unknown'
}

export function normalizeRateLimitEmail(email: string) {
  const [rawLocal, rawDomain = ''] = email.trim().toLowerCase().split('@')
  const domain = rawDomain.trim()
  const withoutAlias = rawLocal.split('+')[0]
  const local = domain === 'gmail.com' || domain === 'googlemail.com'
    ? withoutAlias.replace(/\./g, '')
    : withoutAlias
  return domain ? `${local}@${domain}` : local
}

function windowToMs(window: RateLimitOptions['window']) {
  const match = String(window).trim().match(/^(\d+)\s*(ms|s|m|h|d)$/)
  if (!match) return 60_000
  const value = Number(match[1])
  const unit = match[2]
  if (unit === 'ms') return value
  if (unit === 's') return value * 1000
  if (unit === 'm') return value * 60_000
  if (unit === 'h') return value * 60 * 60_000
  return value * 24 * 60 * 60_000
}

function redisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return Redis.fromEnv()
}

function limiterFor(options: RateLimitOptions) {
  const redis = redisClient()
  if (!redis) return null

  const cacheKey = `${options.key}:${options.limit}:${options.window}`
  const existing = limiters.get(cacheKey)
  if (existing) return existing

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(options.limit, options.window),
    analytics: true,
    prefix: `bodyops:ratelimit:${options.key}`,
    timeout: 2500,
  })
  limiters.set(cacheKey, limiter)
  return limiter
}

function memoryLimit(options: RateLimitOptions) {
  const now = Date.now()
  const key = `${options.key}:${options.identifier}`
  const current = memoryBuckets.get(key)
  const windowMs = windowToMs(options.window)

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs
    memoryBuckets.set(key, { count: 1, resetAt })
    return { success: true, limit: options.limit, remaining: options.limit - 1, reset: resetAt }
  }
  if (current.count >= options.limit) {
    return { success: false, limit: options.limit, remaining: 0, reset: current.resetAt }
  }
  current.count += 1
  return { success: true, limit: options.limit, remaining: options.limit - current.count, reset: current.resetAt }
}

function headersFor(result: { limit: number; remaining: number; reset: number }) {
  const headers = new Headers()
  headers.set('X-RateLimit-Limit', String(result.limit))
  headers.set('X-RateLimit-Remaining', String(Math.max(0, result.remaining)))
  headers.set('X-RateLimit-Reset', String(result.reset))
  return headers
}

function blockedResponse(result: { limit: number; remaining: number; reset: number }) {
  const headers = headersFor(result)
  const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
  headers.set('Retry-After', String(retryAfter))
  const waitLabel = retryAfter >= 60
    ? `${Math.ceil(retryAfter / 60)} minute${Math.ceil(retryAfter / 60) > 1 ? 's' : ''}`
    : `${retryAfter} seconde${retryAfter > 1 ? 's' : ''}`
  return NextResponse.json(
    {
      error: 'Trop de tentatives. Réessaie dans quelques instants.',
      message: `Trop de tentatives. Réessaie dans ${waitLabel}.`,
      retryAfter,
      resetAt: result.reset,
    },
    { status: 429, headers },
  )
}

function logHit(options: RateLimitOptions, result: { success: boolean; remaining: number; reset: number }, source: 'upstash' | 'memory' | 'fallback') {
  console.info('[rate-limit] hit', {
    source,
    bucket: options.key,
    identifier: options.identifier,
    limit: options.limit,
    remaining: result.remaining,
    reset: result.reset,
    allowed: result.success,
  })
}

/** Checks one rate-limit bucket and returns a 429 response when blocked. */
export async function rateLimit(options: RateLimitOptions): Promise<RateLimitPass | RateLimitBlock> {
  const limiter = limiterFor(options)

  try {
    if (!limiter) {
      if (isProduction()) throw new Error('Upstash Redis is not configured.')
      const result = memoryLimit(options)
      logHit(options, result, 'memory')
      if (!result.success) return { ok: false, response: blockedResponse(result) }
      return { ok: true, headers: headersFor(result), remaining: result.remaining, resetAt: result.reset, limit: result.limit }
    }

    const result = await limiter.limit(options.identifier)
    if (result.reason === 'timeout') {
      if (options.fallback === 'closed') throw new Error('Upstash rate-limit timeout.')
      logHit(options, result, 'upstash')
      return { ok: true, headers: headersFor(result), remaining: result.remaining, resetAt: result.reset, limit: result.limit }
    }
    logHit(options, result, 'upstash')
    if (!result.success) return { ok: false, response: blockedResponse(result) }
    return { ok: true, headers: headersFor(result), remaining: result.remaining, resetAt: result.reset, limit: result.limit }
  } catch (error) {
    console.error('[rate-limit] upstash error', {
      bucket: options.key,
      identifier: options.identifier,
      fallback: options.fallback,
      message: error instanceof Error ? error.message : 'unknown',
    })

    const result = {
      success: options.fallback === 'open',
      limit: options.limit,
      remaining: options.fallback === 'open' ? options.limit : 0,
      reset: Date.now() + windowToMs(options.window),
    }
    logHit(options, result, 'fallback')
    if (!result.success) return { ok: false, response: blockedResponse(result) }
    return { ok: true, headers: headersFor(result), remaining: result.remaining, resetAt: result.reset, limit: result.limit }
  }
}

export async function rateLimitByIp(req: Request, key: string, preset: typeof RATE_LIMITS[keyof typeof RATE_LIMITS]) {
  return rateLimit({ key, identifier: `ip:${getClientIp(req)}`, ...preset })
}

export async function rateLimitByUserId(userId: string, key: string, preset: typeof RATE_LIMITS[keyof typeof RATE_LIMITS]) {
  return rateLimit({ key, identifier: `user:${userId}`, ...preset })
}

export async function rateLimitByEmail(email: string, key: string, preset: typeof RATE_LIMITS[keyof typeof RATE_LIMITS]) {
  return rateLimit({ key, identifier: `email:${normalizeRateLimitEmail(email)}`, ...preset })
}

export function mergeHeaders(target: Headers, source: Headers) {
  source.forEach((value, key) => target.set(key, value))
  return target
}
