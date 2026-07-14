export const dynamic = 'force-dynamic'

// API: GET /api/user/profile - returns the profile.
// API: PATCH /api/user/profile - updates the profile.
// Security: session required plus Zod validation

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { updateProfileSchema } from '@/utils/validators'
import { calculateFitnessProfile } from '@/utils/fitness-calculations'
import type { ActivityLevel, FitnessGoal, Gender } from '@prisma/client'
import { profileHealthConsentData } from '@/lib/legal/consent'

/** Returns the member's profile. A user may also own a CoachProfile; the two spaces stay separated by table. */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })
  if (!profile) return NextResponse.json(null, { status: 200 })

  return NextResponse.json(profile)
}

/** Upserts the member's profile and recalculates BMI/BMR/TDEE/macros when physical fields change. */
export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json()
  const parsed = updateProfileSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const {
    healthDataConsentAccepted,
    healthDataConsentVersion,
    healthDataConsentLocale,
    ...data
  } = parsed.data
  const healthConsentData = profileHealthConsentData({
    healthDataConsentAccepted,
    policyVersion: healthDataConsentVersion,
    locale: healthDataConsentLocale,
  })

  // Recalculate BMI/BMR/TDEE when physical data changes
  let calculatedFields = {}
  if (data.weightKg && data.heightCm && data.age && data.gender && data.activityLevel && data.fitnessGoal) {
    const result = calculateFitnessProfile({
      weightKg:      data.weightKg,
      heightCm:      data.heightCm,
      age:           data.age,
      gender:        data.gender as Gender,
      activityLevel: data.activityLevel as ActivityLevel,
      fitnessGoal:   data.fitnessGoal as FitnessGoal,
    })
    calculatedFields = {
      bmi:                result.bmi,
      bmr:                result.bmr,
      tdee:               result.tdee,
      recommendedCalories: result.recommendedCalories,
      recommendedProteinG: result.proteinG,
      recommendedCarbsG:   result.carbsG,
      recommendedFatG:     result.fatG,
    }
  }

  const profile = await prisma.profile.upsert({
    where:  { userId: session.user.id },
    create: { userId: session.user.id, firstName: session.user.name?.split(' ')[0] ?? 'User', age: 25, gender: 'MALE', weightKg: 70, heightCm: 170, activityLevel: 'MODERATELY_ACTIVE', fitnessGoal: 'MAINTENANCE', fitnessLevel: 'BEGINNER', ...data, ...calculatedFields, ...(healthConsentData ?? {}) } as never,
    update: { ...data, ...calculatedFields, ...(healthConsentData ?? {}) } as never,
  })

  return NextResponse.json(profile)
}
