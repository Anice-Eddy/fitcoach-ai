import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    user: {
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  hash: vi.fn(async () => 'hashed-password'),
}))

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { PATCH } from '@/app/api/user/account/route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/user/account', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PATCH /api/user/account', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns 401 when the user is not signed in', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const res = await PATCH(makeRequest({ name: 'Alex' }))
    expect(res.status).toBe(401)
  })

  it('validates account data', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } })
    const res = await PATCH(makeRequest({ email: 'not-an-email' }))
    expect(res.status).toBe(422)
  })

  it('updates name, email, image and password', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } })
    ;(prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'user-1',
      name: 'Alex',
      email: 'alex@example.com',
      image: 'https://example.com/avatar.png',
      provider: 'EMAIL',
    })

    const res = await PATCH(makeRequest({
      name: 'Alex',
      email: 'alex@example.com',
      image: 'https://example.com/avatar.png',
      password: 'password123',
    }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.email).toBe('alex@example.com')
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-1' },
      data: expect.objectContaining({ password: 'hashed-password' }),
    }))
  })
})
