import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth/auth', () => ({ auth: vi.fn() }))

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(async () => []),
}))

vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    bodyMetric: { findMany: mocks.findMany },
    workoutProgram: { findMany: mocks.findMany },
    workoutSession: { findMany: mocks.findMany },
    nutritionPlan: { findMany: mocks.findMany },
    nutritionLog: { findMany: mocks.findMany },
    shoppingList: { findMany: mocks.findMany },
    dailyHabitLog: { findMany: mocks.findMany },
    dailyMission: { findMany: mocks.findMany },
    bodyOpsScore: { findMany: mocks.findMany },
    userNote: { findMany: mocks.findMany },
    coachAppointment: { findMany: mocks.findMany },
    coachNote: { findMany: mocks.findMany },
    coachChat: { findMany: mocks.findMany },
    aIConversation: { findMany: mocks.findMany },
    aIMemory: { findMany: mocks.findMany },
    aIReport: { findMany: mocks.findMany },
    aIUsageDaily: { findMany: mocks.findMany },
    notification: { findMany: mocks.findMany },
    integrationAccount: { findMany: mocks.findMany },
    exportHistory: { findMany: mocks.findMany },
  },
}))

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { GET } from '@/app/api/user/export/route'

describe('GET /api/user/export', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when the user is not signed in', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    const res = await GET()

    expect(res.status).toBe(401)
  })

  it('exports BodyOps data without auth secrets', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } })
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'user-1',
      email: 'eddy@example.com',
      name: 'Eddy',
      image: null,
      provider: 'EMAIL',
      authProvider: 'PASSWORD',
      firebaseEmailVerified: true,
      subscriptionPlan: 'FREE',
      subscriptionStatus: 'INACTIVE',
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      updatedAt: new Date('2026-06-02T00:00:00.000Z'),
      profile: { id: 'profile-1', firstName: 'Eddy' },
      subscription: null,
      coachProfile: null,
      firebaseUid: 'should-not-export',
      password: 'should-not-export',
    })
    ;(prisma.bodyMetric.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 'metric-1', weightKg: 89 }])
    ;(prisma.nutritionLog.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 'log-1', calories: 500 }])

    const res = await GET()
    const json = await res.json()
    const raw = JSON.stringify(json)

    expect(res.status).toBe(200)
    expect(json.version).toBe('2.0')
    expect(json.account.email).toBe('eddy@example.com')
    expect(json.profile.firstName).toBe('Eddy')
    expect(json.progression.metrics).toHaveLength(1)
    expect(json.nutrition.logs).toHaveLength(1)
    expect(raw).not.toContain('should-not-export')
  })
})
