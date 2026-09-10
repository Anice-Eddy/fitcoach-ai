import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma/client', () => ({
  prisma: { $queryRaw: vi.fn(), $executeRaw: vi.fn(async () => 0) },
}))

import { prisma } from '@/lib/prisma/client'
import { consumeRateLimit, rateLimitResponse, requestIdentifier } from '@/lib/security/rate-limit'

describe('distributed rate limit', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('allows requests up to the configured limit', async () => {
    ;(prisma.$queryRaw as ReturnType<typeof vi.fn>).mockResolvedValue([{ count: 2 }])

    const result = await consumeRateLimit({
      scope: 'auth.test',
      identifier: 'user@example.com',
      limit: 3,
      windowMs: 60_000,
    })

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(1)
    const queryArguments = (prisma.$queryRaw as ReturnType<typeof vi.fn>).mock.calls[0].slice(1)
    expect(queryArguments).not.toContain('user@example.com')
  })

  it('returns a 429 response after the limit is exceeded', async () => {
    ;(prisma.$queryRaw as ReturnType<typeof vi.fn>).mockResolvedValue([{ count: 4 }])
    const req = new Request('https://bodyops.test/api/auth', {
      headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.1' },
    })

    const response = await rateLimitResponse(req, {
      scope: 'auth.test',
      limit: 3,
      windowMs: 60_000,
    })

    expect(response?.status).toBe(429)
    expect(response?.headers.get('Retry-After')).toMatch(/^\d+$/)
    expect(requestIdentifier(req)).toBe('ip:203.0.113.10')
  })

  it('fails open when the database is temporarily unavailable', async () => {
    ;(prisma.$queryRaw as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('database unavailable'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const result = await consumeRateLimit({
      scope: 'auth.test',
      identifier: 'user@example.com',
      limit: 1,
      windowMs: 60_000,
    })

    expect(result.allowed).toBe(true)
    expect(consoleSpy).toHaveBeenCalled()
  })
})
