export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/** Returns full member data (profile, body metrics, sessions, programs, nutrition plan, coach notes) after verifying coach ownership. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { memberId: string } },
) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const coach = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { coachProfile: true },
  })
  if (!coach?.coachProfile) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  // Verify the member belongs to this coach
  const membership = await prisma.coachMember.findUnique({
    where: { coachId_memberId: { coachId: coach.coachProfile.id, memberId: params.memberId } },
  })
  if (!membership) return NextResponse.json({ error: 'Membre introuvable' }, { status: 404 })

  const member = await prisma.user.findUnique({
    where: { id: params.memberId },
    include: {
      profile: true,
      bodyMetrics: { orderBy: { date: 'desc' }, take: 30 },
      workoutSessions: {
        where: { status: { in: ['COMPLETED', 'IN_PROGRESS', 'PLANNED'] } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      workoutPrograms: { where: { isActive: true }, take: 1 },
      nutritionPlans: { where: { isActive: true }, take: 1, include: { meals: true } },
    },
  })

  if (!member) return NextResponse.json({ error: 'Membre introuvable' }, { status: 404 })

  const notes = await prisma.coachNote.findMany({
    where: { coachId: coach.coachProfile.id, memberId: params.memberId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ ...member, coachNotes: notes, assignedAt: membership.assignedAt })
}

/** Removes the member from the coach's tracked list by deleting the CoachMember record. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { memberId: string } },
) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const coach = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { coachProfile: true },
  })
  if (!coach?.coachProfile) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  await prisma.coachMember.deleteMany({
    where: { coachId: coach.coachProfile.id, memberId: params.memberId },
  })

  return NextResponse.json({ ok: true })
}

/** Allows the coach to update the member's profile fields (body stats, goals, equipment, etc.) with the same permissions as the member. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { memberId: string } },
) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const coach = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { coachProfile: true },
  })
  if (!coach?.coachProfile) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const membership = await prisma.coachMember.findUnique({
    where: { coachId_memberId: { coachId: coach.coachProfile.id, memberId: params.memberId } },
  })
  if (!membership) return NextResponse.json({ error: 'Membre introuvable' }, { status: 404 })

  const body = await req.json()

  // Allow updating profile fields (same as user's own profile API)
  const profileData: Record<string, unknown> = {}
  const allowed = [
    'firstName','age','gender','weightKg','heightCm','waistCm','hipsCm',
    'weightUnit','heightUnit','activityLevel','availableEquipment','trainingDaysPerWeek',
    'fitnessGoal','targetWeightKg','fitnessLevel','dietaryRestrictions','foodPreferences',
  ]
  for (const key of allowed) {
    if (key in body) profileData[key] = body[key]
  }

  const updated = await prisma.profile.upsert({
    where:  { userId: params.memberId },
    update: profileData,
    create: {
      userId:      params.memberId,
      firstName:   body.firstName ?? '',
      age:         body.age ?? 18,
      gender:      body.gender ?? 'MALE',
      weightKg:    body.weightKg ?? 70,
      heightCm:    body.heightCm ?? 170,
      activityLevel:       body.activityLevel ?? 'MODERATELY_ACTIVE',
      availableEquipment:  body.availableEquipment ?? [],
      trainingDaysPerWeek: body.trainingDaysPerWeek ?? 3,
      fitnessGoal:  body.fitnessGoal ?? 'GENERAL_FITNESS',
      fitnessLevel: body.fitnessLevel ?? 'BEGINNER',
      dietaryRestrictions: body.dietaryRestrictions ?? [],
      foodPreferences:     body.foodPreferences ?? [],
    },
  })

  return NextResponse.json(updated)
}
