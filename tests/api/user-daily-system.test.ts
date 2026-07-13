import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    profile: { findUnique: vi.fn() },
    bodyMetric: { findFirst: vi.fn() },
    nutritionLog: { findMany: vi.fn() },
    workoutSession: { count: vi.fn() },
    dailyHabitLog: { findMany: vi.fn() },
    bodyOpsScore: { upsert: vi.fn() },
    dailyMission: { upsert: vi.fn() },
  },
}))

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { GET } from '@/app/api/user/daily-system/route'

function request(search = '') {
  return new Request(`http://localhost/api/user/daily-system${search}`)
}

describe('GET /api/user/daily-system', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } })
    ;(prisma.profile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ recommendedProteinG: 160, language: 'fr' })
    ;(prisma.bodyMetric.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ waterLiters: 3, sleepHours: 7.5, steps: 9000, weightKg: 80 })
    ;(prisma.nutritionLog.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ proteinG: 100 }, { proteinG: 70 }])
    ;(prisma.workoutSession.count as ReturnType<typeof vi.fn>).mockResolvedValue(1)
    ;(prisma.dailyHabitLog.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])
    ;(prisma.bodyOpsScore.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({ date: '2026-06-02', score: 100 })
    ;(prisma.dailyMission.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({})
  })

  it('returns 401 when unauthenticated', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const res = await GET(request())
    expect(res.status).toBe(401)
  })

  it('computes missions and persists the daily score', async () => {
    const res = await GET(request('?date=2026-06-02'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.missions).toHaveLength(5)
    expect(json.missions.map((mission: { title: string }) => mission.title)).toContain("3 L d'eau")
    expect(json.missions.every((mission: { isCompleted: boolean }) => mission.isCompleted)).toBe(true)
    expect(prisma.bodyOpsScore.upsert).toHaveBeenCalled()
    expect(prisma.dailyMission.upsert).toHaveBeenCalledTimes(5)
  })

  it('uses English mission labels for English profiles', async () => {
    ;(prisma.profile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ recommendedProteinG: 160, language: 'en' })

    const res = await GET(request('?date=2026-06-02'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.missions.map((mission: { title: string }) => mission.title)).toEqual([
      '8000 steps',
      '160 g protein',
      '3 L water',
      '7 h sleep',
      'Daily session',
    ])
  })

  it('returns 422 when the date is invalid', async () => {
    const res = await GET(request('?date=demain'))
    expect(res.status).toBe(422)
  })
})
