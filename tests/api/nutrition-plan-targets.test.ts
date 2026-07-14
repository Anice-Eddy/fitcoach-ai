import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    coachMember: {
      findUnique: vi.fn(),
    },
    nutritionPlan: {
      findFirst: vi.fn(),
      update:    vi.fn(),
      create:    vi.fn(),
    },
  },
}))

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { PATCH as patchCoachTargets } from '@/app/api/coach/members/[memberId]/nutrition-targets/route'
import { GET as getUserPlan } from '@/app/api/user/nutrition/plan/route'

function jsonReq(body: unknown) {
  return new Request('http://localhost/api/test', {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

describe('nutrition plan targets', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns the active nutrition plan for the signed-in member', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'member-1' } })
    ;(prisma.nutritionPlan.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'plan-1',
      targetCalories: 2400,
      targetProteinG: 170,
      targetCarbsG: 260,
      targetFatG: 70,
    })

    const res = await getUserPlan()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.targetCalories).toBe(2400)
    expect(prisma.nutritionPlan.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'member-1', isActive: true },
    }))
  })

  it('updates the active plan for the member followed by the coach', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { email: 'coach@test.com' } })
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ coachProfile: { id: 'coach-profile' } })
    ;(prisma.coachMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ coachId: 'coach-profile', memberId: 'member-1' })
    ;(prisma.nutritionPlan.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'plan-1' })
    ;(prisma.nutritionPlan.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'plan-1', targetCalories: 2600 })

    const res = await patchCoachTargets(jsonReq({
      targetCalories: 2600,
      targetProteinG: 180,
      targetCarbsG: 300,
      targetFatG: 75,
    }) as never, { params: Promise.resolve({ memberId: 'member-1' }) })

    expect(res.status).toBe(200)
    expect(prisma.nutritionPlan.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'plan-1' },
      data: expect.objectContaining({
        name: 'Coach nutrition target',
        targetCalories: 2600,
        targetProteinG: 180,
      }),
    }))
  })

  it('creates an active plan if the followed member does not have one yet', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { email: 'coach@test.com' } })
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ coachProfile: { id: 'coach-profile' } })
    ;(prisma.coachMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ coachId: 'coach-profile', memberId: 'member-1' })
    ;(prisma.nutritionPlan.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(prisma.nutritionPlan.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'plan-1', targetCalories: 2300 })

    const res = await patchCoachTargets(jsonReq({
      targetCalories: '2300',
      targetProteinG: '160',
      targetCarbsG: '250',
      targetFatG: '65',
    }) as never, { params: Promise.resolve({ memberId: 'member-1' }) })

    expect(res.status).toBe(200)
    expect(prisma.nutritionPlan.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: 'member-1',
        name: 'Coach nutrition target',
        targetCalories: 2300,
      }),
    }))
  })
})
