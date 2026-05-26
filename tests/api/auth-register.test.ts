import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    user: {
      create:     vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  hash: vi.fn(async () => 'hashed-password'),
}))

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

  it('demande la connexion quand un coach utilise un email existant', async () => {
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id:           'user-1',
    })

    const res = await POST(makeRequest(coachPayload))
    const json = await res.json()

    expect(res.status).toBe(409)
    expect(json.error.email[0]).toBe('Cet email est déjà utilisé. Connectez-vous pour accéder à votre compte.')
    expect(prisma.user.create).not.toHaveBeenCalled()
  })
})
