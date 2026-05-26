import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    user: {
      create:     vi.fn(),
      findUnique: vi.fn(),
      update:     vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
  hash:    vi.fn(async () => 'hashed-password'),
}))

import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma/client'
import { POST } from '@/app/api/auth/register/route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/auth/register', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

const coachPayload = {
  name:              'Coach Alex',
  email:             'alex@example.com',
  password:          'password123',
  accountType:       'COACH',
  bio:               'Coach certifie specialise en force, nutrition et recomposition corporelle.',
  specialties:       'Musculation, nutrition',
  certifications:    'BPJEPS, NASM',
  yearsExperience:   '6',
  city:              'Paris',
  phone:             '+33 6 12 34 56 78',
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('ajoute un espace coach a un compte client existant avec le meme email', async () => {
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id:           'user-1',
      password:     'hashed-existing-password',
      coachProfile: null,
    })
    ;(compare as ReturnType<typeof vi.fn>).mockResolvedValue(true)
    ;(prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'user-1' })

    const res = await POST(makeRequest(coachPayload))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-1' },
      data:  expect.objectContaining({
        subscriptionPlan: 'BUSINESS',
        coachProfile:    expect.objectContaining({
          create: expect.objectContaining({
            specialties:    ['Musculation', 'nutrition'],
            certifications: ['BPJEPS', 'NASM'],
          }),
        }),
      }),
    }))
  })

  it('refuse de convertir un compte client si le mot de passe ne correspond pas', async () => {
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id:           'user-1',
      password:     'hashed-existing-password',
      coachProfile: null,
    })
    ;(compare as ReturnType<typeof vi.fn>).mockResolvedValue(false)

    const res = await POST(makeRequest(coachPayload))
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error.password[0]).toMatch(/mot de passe de votre compte client/i)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })
})
