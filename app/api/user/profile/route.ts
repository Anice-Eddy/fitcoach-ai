export const dynamic = 'force-dynamic'

// API : GET /api/user/profile — récupère le profil
// API : PATCH /api/user/profile — met à jour le profil
// Sécurité : session requise + validation Zod

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { updateProfileSchema } from '@/utils/validators'
import { calculateFitnessProfile } from '@/utils/fitness-calculations'
import type { ActivityLevel, FitnessGoal, Gender } from '@prisma/client'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } })
  if (!profile) return NextResponse.json(null, { status: 200 })

  return NextResponse.json(profile)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body   = await req.json()
  const parsed = updateProfileSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const data = parsed.data

  // Recalcule IMC/BMR/TDEE si les données physiques changent
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
    create: { userId: session.user.id, firstName: 'Utilisateur', age: 25, gender: 'MALE', weightKg: 70, heightCm: 170, activityLevel: 'MODERATELY_ACTIVE', fitnessGoal: 'MAINTENANCE', fitnessLevel: 'BEGINNER', ...data, ...calculatedFields } as never,
    update: { ...data, ...calculatedFields } as never,
  })

  return NextResponse.json(profile)
}
