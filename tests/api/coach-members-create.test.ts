import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    coachMember: {
      create: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { POST } from '@/app/api/coach/members/route'

const coach = { id: 'coach-user', email: 'coach@test.com', coachProfile: { id: 'coach-profile' } }

const validBody = {
  mode: 'CREATE_MEMBER',
  firstName: 'Alex',
  lastName: 'Martin',
  email: 'alex@test.com',
  password: 'password123',
  age: 28,
  gender: 'MALE',
  weightKg: 82,
  heightCm: 180,
  activityLevel: 'MODERATELY_ACTIVE',
  trainingDaysPerWeek: 4,
  availableEquipment: ['BODYWEIGHT', 'DUMBBELL'],
  fitnessGoal: 'MUSCLE_GAIN',
  fitnessLevel: 'INTERMEDIATE',
  bodyFocus: 'FULL_BODY',
  dietaryRestrictions: [],
  foodPreferences: ['riz'],
}

function req(body: unknown) {
  return new Request('http://localhost/api/coach/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/coach/members create member', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { email: 'coach@test.com' } })
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(coach)
      .mockResolvedValueOnce(null)
    ;(prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (callback) => callback({
      user: {
        create: vi.fn().mockResolvedValue({ id: 'member-1', email: 'alex@test.com', name: 'Alex Martin' }),
      },
      coachMember: {
        create: vi.fn().mockResolvedValue({
          member: { id: 'member-1', email: 'alex@test.com', name: 'Alex Martin', profile: {}, bodyMetrics: [] },
        }),
      },
      notification: {
        create: vi.fn().mockResolvedValue({ id: 'notif-1' }),
      },
    }))
  })

  it('returns 401 when unauthenticated', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const res = await POST(req(validBody))
    expect(res.status).toBe(401)
  })

  it('returns 403 when the signed-in user is not a coach', async () => {
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockReset()
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'u1', coachProfile: null })
    const res = await POST(req(validBody))
    expect(res.status).toBe(403)
  })

  it('creates a complete client inside a transaction', async () => {
    const res = await POST(req(validBody))
    expect(res.status).toBe(201)
    expect(prisma.$transaction).toHaveBeenCalled()
  })

  it('rejects an incomplete client profile', async () => {
    const res = await POST(req({ ...validBody, email: 'pas-un-email' }))
    expect(res.status).toBe(422)
  })
})
