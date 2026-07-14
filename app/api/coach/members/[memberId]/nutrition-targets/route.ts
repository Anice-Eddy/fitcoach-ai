export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const nutritionTargetsSchema = z.object({
  targetCalories: z.coerce.number().min(800).max(8000),
  targetProteinG: z.coerce.number().min(20).max(500),
  targetCarbsG:   z.coerce.number().min(20).max(1000),
  targetFatG:     z.coerce.number().min(10).max(400),
})

const COACH_NUTRITION_TARGET_NAME = 'Coach nutrition target'

async function authorizeCoach(memberId: string) {
  const session = await auth()
  if (!session?.user?.email) return { error: NextResponse.json({ error: 'Unauthenticated' }, { status: 401 }) }

  const coach = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { coachProfile: true },
  })
  if (!coach?.coachProfile) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) }

  const membership = await prisma.coachMember.findUnique({
    where: { coachId_memberId: { coachId: coach.coachProfile.id, memberId } },
  })
  if (!membership) return { error: NextResponse.json({ error: 'Member not found' }, { status: 404 }) }

  return { coachProfileId: coach.coachProfile.id, userId: coach.id }
}

/** Creates or updates the active nutrition target chosen by the coach without overwriting calculated profile recommendations. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  const { error } = await authorizeCoach((await params).memberId)
  if (error) return error

  const parsed = nutritionTargetsSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const existing = await prisma.nutritionPlan.findFirst({
    where: { userId: (await params).memberId, isActive: true },
    orderBy: { updatedAt: 'desc' },
  })

  const plan = existing
    ? await prisma.nutritionPlan.update({
        where: { id: existing.id },
        data:  { name: COACH_NUTRITION_TARGET_NAME, ...parsed.data },
      })
    : await prisma.nutritionPlan.create({
        data: {
          userId: (await params).memberId,
          name:   COACH_NUTRITION_TARGET_NAME,
          ...parsed.data,
          weekStartDate: new Date(),
          isActive: true,
        },
      })

  return NextResponse.json(plan)
}
