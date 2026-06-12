import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update:     vi.fn(),
      create:     vi.fn(),
    },
    account: {
      upsert: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma/client'
import { findOrCreateUserFromFirebase } from '@/lib/firebase/users'

const decoded = {
  uid: 'firebase-uid-1',
  email: 'Member@Example.com',
  email_verified: true,
  name: 'Member One',
  picture: 'https://example.com/avatar.png',
  firebase: { sign_in_provider: 'google.com' },
}

describe('findOrCreateUserFromFirebase', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('lie un utilisateur existant via email sans créer de doublon', async () => {
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'user-1',
        email: 'member@example.com',
        name: null,
        image: null,
        authMigratedAt: null,
        profile: null,
        coachProfile: null,
      })
    ;(prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'user-1' })

    await findOrCreateUserFromFirebase(decoded as never)

    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-1' },
      data: expect.objectContaining({
        firebaseUid: 'firebase-uid-1',
        authProvider: 'GOOGLE',
        firebaseEmailVerified: true,
        provider: 'GOOGLE',
      }),
    }))
    expect(prisma.user.create).not.toHaveBeenCalled()
    expect(prisma.account.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: 'firebase-uid-1',
        },
      },
      update: { userId: 'user-1' },
    }))
  })

  it('crée un utilisateur BodyOps quand email et firebase_uid sont inconnus', async () => {
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
    ;(prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'user-new' })

    await findOrCreateUserFromFirebase(decoded as never)

    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        email: 'member@example.com',
        firebaseUid: 'firebase-uid-1',
        authProvider: 'GOOGLE',
        password: null,
      }),
    }))
    expect(prisma.account.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        userId: 'user-new',
        provider: 'google',
        providerAccountId: 'firebase-uid-1',
      }),
    }))
  })
})
