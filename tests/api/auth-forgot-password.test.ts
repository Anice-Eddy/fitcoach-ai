import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma/client'
import { POST } from '@/app/api/auth/forgot-password/route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/auth/forgot-password', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('autorise le frontend à demander un email Firebase pour un compte email', async () => {
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id:           'user-1',
      password:     null,
      provider:     'EMAIL',
      authProvider: 'FIREBASE',
    })

    const res = await POST(makeRequest({ email: 'eddy@example.com', intent: 'firebase' }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.method).toBe('firebase-client-email')
  })

  it('refuse les comptes sociaux car leur mot de passe est géré par le fournisseur', async () => {
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id:           'user-1',
      password:     null,
      provider:     'GOOGLE',
      authProvider: 'FIREBASE',
    })

    const res = await POST(makeRequest({ email: 'eddy@example.com', intent: 'firebase' }))
    const json = await res.json()

    expect(res.status).toBe(409)
    expect(json.reason).toBe('SOCIAL_PROVIDER')
    expect(json.provider).toBe('Google')
  })
})
