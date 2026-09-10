import { createHash, randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

type RateLimitOptions = {
  scope: string
  identifier: string
  limit: number
  windowMs: number
}

export type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  retryAfterSeconds: number
}

function hashIdentifier(identifier: string) {
  const pepper = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'bodyops-rate-limit'
  return createHash('sha256').update(`${pepper}:${identifier}`).digest('hex')
}

export function requestIdentifier(req: Request) {
  const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ip = forwardedFor || req.headers.get('x-real-ip') || 'unknown-ip'
  return `ip:${ip}`
}

/**
 * Consumes one request in a database-backed fixed window.
 * It fails open if storage is temporarily unavailable so an incidental database
 * outage does not lock every user out of authentication.
 */
export async function consumeRateLimit({ scope, identifier, limit, windowMs }: RateLimitOptions): Promise<RateLimitResult> {
  const now = Date.now()
  const windowStartMs = Math.floor(now / windowMs) * windowMs
  const windowStart = new Date(windowStartMs)
  const expiresAt = new Date(windowStartMs + windowMs * 2)
  const retryAfterSeconds = Math.max(1, Math.ceil((windowStartMs + windowMs - now) / 1000))

  try {
    const keyHash = hashIdentifier(identifier)
    const [bucket] = await prisma.$queryRaw<Array<{ count: number }>>`
      INSERT INTO "rate_limit_buckets"
        ("id", "scope", "keyHash", "windowStart", "expiresAt", "count")
      VALUES
        (${randomUUID()}, ${scope}, ${keyHash}, ${windowStart}, ${expiresAt}, 1)
      ON CONFLICT ("scope", "keyHash", "windowStart")
      DO UPDATE SET
        "count" = "rate_limit_buckets"."count" + 1,
        "expiresAt" = EXCLUDED."expiresAt"
      RETURNING "count"
    `

    const count = bucket?.count ?? 1

    // Opportunistic bounded cleanup: once per newly created bucket/window.
    if (count === 1) {
      await prisma.$executeRaw`
        DELETE FROM "rate_limit_buckets"
        WHERE "expiresAt" < ${new Date(now)}
      `.catch((error) => console.error('[rate-limit] cleanup failed:', error))
    }

    return {
      allowed: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      retryAfterSeconds,
    }
  } catch (error) {
    console.error('[rate-limit] storage unavailable:', error)
    return { allowed: true, limit, remaining: limit, retryAfterSeconds }
  }
}

export async function rateLimitResponse(req: Request, options: Omit<RateLimitOptions, 'identifier'> & { identifier?: string }) {
  const result = await consumeRateLimit({
    ...options,
    identifier: options.identifier ?? requestIdentifier(req),
  })

  if (result.allowed) return null

  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSeconds),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
      },
    },
  )
}
