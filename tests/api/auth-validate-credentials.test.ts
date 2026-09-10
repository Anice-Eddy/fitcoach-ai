import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    $queryRaw: vi.fn(async () => [{ count: 1 }]),
    user: { findUnique: vi.fn() },
  },
}))

vi.mock('bcryptjs', () => ({ compare: vi.fn() }))

import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma/client'
import { POST } from '@/app/api/auth/validate-credentials/route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/auth/validate-credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.20' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/validate-credentials', () => {
  beforeEach(() => vi.resetAllMocks())

  it.each([
    ['unknown account', null],
    ['provider-only account', { password: null, coachProfile: null, profile: null }],
  ])('returns a generic response for an %s', async (_label, user) => {
    ;(prisma.$queryRaw as ReturnType<typeof vi.fn>).mockResolvedValue([{ count: 1 }])
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(user)

    const res = await POST(makeRequest({ email: 'unknown@example.com', password: 'secret' }))

    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toEqual({ valid: false, reason: 'INVALID_CREDENTIALS' })
  })

  it('uses the same response for an incorrect password', async () => {
    ;(prisma.$queryRaw as ReturnType<typeof vi.fn>).mockResolvedValue([{ count: 1 }])
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      password: 'hash', coachProfile: null, profile: {},
    })
    ;(compare as ReturnType<typeof vi.fn>).mockResolvedValue(false)

    const res = await POST(makeRequest({ email: 'member@example.com', password: 'wrong' }))

    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toEqual({ valid: false, reason: 'INVALID_CREDENTIALS' })
  })
})
