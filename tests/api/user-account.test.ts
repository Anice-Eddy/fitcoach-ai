import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    user: {
      update: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  hash: vi.fn(async () => 'hashed-password'),
  compare: vi.fn(async () => true),
}))

vi.mock('@/lib/firebase/delete-user', () => ({
  deleteExternalAuthUser: vi.fn(),
}))

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { compare } from 'bcryptjs'
import { deleteExternalAuthUser } from '@/lib/firebase/delete-user'
import { DELETE, PATCH } from '@/app/api/user/account/route'

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

  it('accepts null image to clear the avatar', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } })
    ;(prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'user-1',
      name: 'Alex',
      email: 'alex@example.com',
      image: null,
      provider: 'EMAIL',
    })

    const res = await PATCH(makeRequest({ name: 'Alex', image: null }))

    expect(res.status).toBe(200)
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ image: null }),
    }))
  })
})

describe('DELETE /api/user/account', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  function deleteRequest(body?: unknown) {
    return new Request('http://localhost/api/user/account', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  }

  it('returns 401 when the user is not signed in', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    const res = await DELETE(deleteRequest())

    expect(res.status).toBe(401)
  })

  it('deletes the external auth identity before deleting the BodyOps user', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } })
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      password: null,
      firebaseUid: 'firebase-uid-1',
    })
    ;(deleteExternalAuthUser as ReturnType<typeof vi.fn>).mockResolvedValue({ deleted: true })
    ;(prisma.user.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'user-1' })

    const res = await DELETE(deleteRequest())

    expect(res.status).toBe(200)
    expect(deleteExternalAuthUser).toHaveBeenCalledWith('firebase-uid-1')
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } })
  })

  it('does not delete the BodyOps user if external auth deletion fails', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } })
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      password: null,
      firebaseUid: 'firebase-uid-1',
    })
    ;(deleteExternalAuthUser as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('auth unavailable'))

    const res = await DELETE(deleteRequest())

    expect(res.status).toBe(503)
    expect(prisma.user.delete).not.toHaveBeenCalled()
  })

  it('requires and validates the password for legacy password accounts', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } })
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      password: 'hashed-password',
      firebaseUid: null,
    })
    ;(compare as ReturnType<typeof vi.fn>).mockResolvedValue(false)

    const res = await DELETE(deleteRequest({ password: 'wrong-password' }))

    expect(res.status).toBe(403)
    expect(prisma.user.delete).not.toHaveBeenCalled()
  })
})
