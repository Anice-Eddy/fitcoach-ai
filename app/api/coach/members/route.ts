export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { calculateFitnessProfile } from '@/utils/fitness-calculations'
import { hash } from 'bcryptjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { ActivityLevel, BodyFocus, Equipment, FitnessGoal, FitnessLevel, Gender } from '@prisma/client'

export const runtime = 'nodejs'

const memberCreateSchema = z.object({
  mode: z.literal('CREATE_MEMBER'),
  firstName: z.string().min(2).max(50).trim(),
  lastName: z.string().max(60).optional().default(''),
  email: z.string().email().transform(email => email.trim().toLowerCase()),
  password: z.string().min(8).max(100),
  age: z.coerce.number().int().min(13).max(100),
  gender: z.enum(['MALE', 'FEMALE']),
  weightKg: z.coerce.number().min(30).max(300),
  heightCm: z.coerce.number().min(100).max(250),
  waistCm: z.preprocess(v => v === '' || v == null ? undefined : Number(v), z.number().min(40).max(200).optional()),
  hipsCm: z.preprocess(v => v === '' || v == null ? undefined : Number(v), z.number().min(40).max(200).optional()),
  activityLevel: z.enum(['SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTREMELY_ACTIVE']),
  trainingDaysPerWeek: z.coerce.number().int().min(1).max(7),
  availableEquipment: z.array(z.enum([
    'BARBELL', 'DUMBBELL', 'KETTLEBELL', 'RESISTANCE_BAND', 'PULL_UP_BAR',
    'BENCH', 'CABLE_MACHINE', 'SMITH_MACHINE', 'BODYWEIGHT', 'CARDIO_MACHINE',
    'CHEST_PRESS_MACHINE', 'HIP_THRUST_MACHINE',
  ])).min(1),
  fitnessGoal: z.enum(['WEIGHT_LOSS', 'MUSCLE_GAIN', 'MAINTENANCE', 'ENDURANCE', 'FLEXIBILITY', 'GENERAL_FITNESS']),
  fitnessLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ATHLETE']),
  targetWeightKg: z.preprocess(v => v === '' || v == null ? undefined : Number(v), z.number().min(30).max(300).optional()),
  bodyFocus: z.enum(['UPPER_BODY', 'LOWER_BODY', 'FULL_BODY']).default('FULL_BODY'),
  dietaryRestrictions: z.array(z.string().max(80)).default([]),
  foodPreferences: z.array(z.string().max(80)).default([]),
  bodyFatPct: z.preprocess(v => v === '' || v == null ? undefined : Number(v), z.number().min(1).max(70).optional()),
  steps: z.preprocess(v => v === '' || v == null ? undefined : Number(v), z.number().int().min(0).max(100000).optional()),
  sleepHours: z.preprocess(v => v === '' || v == null ? undefined : Number(v), z.number().min(0).max(24).optional()),
  waterLiters: z.preprocess(v => v === '' || v == null ? undefined : Number(v), z.number().min(0).max(15).optional()),
  notes: z.string().max(500).optional().default(''),
})

async function withChatBadges<T extends { memberId: string }[]>(items: T, coachId: string, coachUserId: string) {
  const chats = await prisma.coachChat.findMany({
    where: { coachId, memberId: { in: items.map(item => item.memberId) } },
    select: {
      id: true,
      memberId: true,
      lastMessageAt: true,
      messages: {
        where: { senderUserId: { not: coachUserId }, readAt: null },
        select: { id: true },
      },
    },
  })
  const chatByMemberId = new Map(chats.map(chat => [chat.memberId, chat]))

  return items.map(item => {
    const chat = chatByMemberId.get(item.memberId)
    return {
      ...item,
      chat: chat ? { id: chat.id, unreadCount: chat.messages.length, lastMessageAt: chat.lastMessageAt } : null,
    }
  })
}

/** Returns the coach's member list with latest body metrics; auto-adds any members who have an appointment but are missing a CoachMember record. */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthenticated' },
        { status: 401 }
      )
    }

    // Fetch the coach and their members
    const coach = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        coachProfile: {
          include: {
            coachMembers: {
              include: {
                member: {
                  include: {
                    profile: true,
                    bodyMetrics: {
                      orderBy: { date: 'desc' },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!coach?.coachProfile) {
      return NextResponse.json(
        { error: 'Coach access required' },
        { status: 403 }
      )
    }

    // Sync: auto-add members who have an upcoming scheduled appointment but aren't in the list yet.
    // Deliberately excludes past/completed appointments so that removing a member doesn't get undone.
    const confirmedAppointments = await prisma.coachAppointment.findMany({
      where: {
        coachId: coach.coachProfile.id,
        status: { in: ['PENDING', 'PROPOSED', 'CONFIRMED'] },
        scheduledAt: { gte: new Date() },
      },
      select: { memberId: true },
      distinct: ['memberId'],
    })

    const existingMemberIds = new Set(coach.coachProfile.coachMembers.map(m => m.memberId))
    const toAdd = confirmedAppointments.filter(a => !existingMemberIds.has(a.memberId))

    if (toAdd.length > 0) {
      await prisma.coachMember.createMany({
        data:           toAdd.map(a => ({ coachId: coach.coachProfile!.id, memberId: a.memberId })),
        skipDuplicates: true,
      })

      // Re-fetch with newly added members
      const updated = await prisma.coachProfile.findUnique({
        where: { id: coach.coachProfile.id },
        include: {
          coachMembers: {
            include: {
              member: {
                include: {
                  profile: true,
                  bodyMetrics: { orderBy: { date: 'desc' }, take: 1 },
                },
              },
            },
          },
        },
      })
      const items = updated?.coachMembers ?? []
      return NextResponse.json(await withChatBadges(items, coach.coachProfile.id, coach.id))
    }

    return NextResponse.json(await withChatBadges(coach.coachProfile.coachMembers, coach.coachProfile.id, coach.id))
  } catch (error) {
    console.error('GET /api/coach/members:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

/** Adds a member to the coach's tracked list and creates a NEW_MEMBER coach notification; returns 201 with the CoachMember record. */
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthenticated' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const createParsed = memberCreateSchema.safeParse(body)

    if (createParsed.success) {
      const data = createParsed.data

      const coach = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { coachProfile: true },
      })

      if (!coach?.coachProfile) {
        return NextResponse.json(
          { error: 'Coach access required' },
          { status: 403 }
        )
      }

      const existing = await prisma.user.findUnique({
        where: { email: data.email },
        select: { id: true, coachMembers: { where: { coachId: coach.coachProfile.id }, select: { id: true } } },
      })

      if (existing?.coachMembers.length) {
        return NextResponse.json({ error: 'This client is already in your list.' }, { status: 409 })
      }
      if (existing) {
        const coachMember = await prisma.coachMember.create({
          data: { coachId: coach.coachProfile.id, memberId: existing.id },
          include: { member: { include: { profile: true, bodyMetrics: { orderBy: { date: 'desc' }, take: 1 } } } },
        })
        return NextResponse.json(coachMember, { status: 201 })
      }

      const calculated = calculateFitnessProfile({
        weightKg: data.weightKg,
        heightCm: data.heightCm,
        age: data.age,
        gender: data.gender as Gender,
        activityLevel: data.activityLevel as ActivityLevel,
        fitnessGoal: data.fitnessGoal as FitnessGoal,
      })
      const password = await hash(data.password, 12)
      const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ')

      const coachMember = await prisma.$transaction(async (tx) => {
        const member = await tx.user.create({
          data: {
            email: data.email,
            name: fullName,
            password,
            provider: 'EMAIL',
            subscriptionPlan: 'FREE',
            profile: {
              create: {
                firstName: data.firstName,
                age: data.age,
                gender: data.gender as Gender,
                weightKg: data.weightKg,
                heightCm: data.heightCm,
                waistCm: data.waistCm ?? null,
                hipsCm: data.hipsCm ?? null,
                activityLevel: data.activityLevel as ActivityLevel,
                availableEquipment: data.availableEquipment as Equipment[],
                trainingDaysPerWeek: data.trainingDaysPerWeek,
                fitnessGoal: data.fitnessGoal as FitnessGoal,
                targetWeightKg: data.targetWeightKg ?? null,
                fitnessLevel: data.fitnessLevel as FitnessLevel,
                bodyFocus: data.bodyFocus as BodyFocus,
                dietaryRestrictions: data.dietaryRestrictions,
                foodPreferences: data.foodPreferences,
                bmi: calculated.bmi,
                bmr: calculated.bmr,
                tdee: calculated.tdee,
                recommendedCalories: calculated.recommendedCalories,
                recommendedProteinG: calculated.proteinG,
                recommendedCarbsG: calculated.carbsG,
                recommendedFatG: calculated.fatG,
                onboardingCompleted: true,
              },
            },
            bodyMetrics: {
              create: {
                weightKg: data.weightKg,
                bodyFatPct: data.bodyFatPct ?? null,
                waistCm: data.waistCm ?? null,
                hipsCm: data.hipsCm ?? null,
                steps: data.steps ?? null,
                sleepHours: data.sleepHours ?? null,
                waterLiters: data.waterLiters ?? null,
                notes: data.notes || null,
              },
            },
          },
        })

        const relation = await tx.coachMember.create({
          data: {
            coachId: coach.coachProfile!.id,
            memberId: member.id,
          },
          include: {
            member: {
              include: {
                profile: true,
                bodyMetrics: { orderBy: { date: 'desc' }, take: 1 },
              },
            },
          },
        })

        await tx.notification.create({
          data: {
            coachId: coach.coachProfile!.id,
            recipientUserId: null,
            type: 'NEW_MEMBER',
            title: `New client: ${fullName}`,
            message: `${fullName} was created and added to your tracked members.`,
            relatedId: member.id,
          },
        })

        return relation
      })

      return NextResponse.json(coachMember, { status: 201 })
    }

    const { memberId } = body

    if (!memberId) {
      return NextResponse.json(
        { error: createParsed.error.flatten().fieldErrors ?? 'Missing memberId' },
        { status: 422 }
      )
    }

    // Verify that the coach exists
    const coach = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { coachProfile: true },
    })

    if (!coach?.coachProfile) {
      return NextResponse.json(
        { error: 'Coach access required' },
        { status: 403 }
      )
    }

    // Add the member to the coach's tracked list.
    const coachMember = await prisma.coachMember.create({
      data: {
        coachId: coach.coachProfile.id,
        memberId,
      },
      include: {
        member: {
          include: { profile: true },
        },
      },
    })

    // Create a notification
    await prisma.notification.create({
      data: {
        coachId:         coach.coachProfile.id,
        recipientUserId: null,
        type:            'NEW_MEMBER',
        title:           `New member: ${coachMember.member.name}`,
        message:         `${coachMember.member.name} was added to your tracked members.`,
        relatedId:       memberId,
      },
    })

    return NextResponse.json(coachMember, { status: 201 })
  } catch (error) {
    console.error('POST /api/coach/members:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
