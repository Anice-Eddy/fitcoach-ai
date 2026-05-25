// Seed Prisma — 2 users + coach + programme PPL + nutrition 7j + 20 produits affiliés
// Exécution : npx prisma db seed

import { PrismaClient, SubscriptionPlan, SubscriptionStatus, Gender, ActivityLevel, FitnessGoal, FitnessLevel, AffiliateCategory } from '@prisma/client'
import { AFFILIATE_PRODUCTS } from '../lib/affiliates/products'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // --- Users ---
  const alice = await prisma.user.upsert({
    where: { email: 'alice@fitcoachai.app' },
    update: {},
    create: {
      email: 'alice@fitcoachai.app',
      name:  'Alice Demo',
      subscription: {
        create: {
          plan:   SubscriptionPlan.PRO,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
          currentPeriodEnd:   new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
      profile: {
        create: {
          firstName:    'Alice',
          age:          28,
          gender:       Gender.FEMALE,
          weightKg:     62,
          heightCm:     167,
          activityLevel: ActivityLevel.MODERATE,
          fitnessGoals: [FitnessGoal.MUSCLE_GAIN],
          fitnessLevel: FitnessLevel.INTERMEDIATE,
          targetWeightKg: 66,
          trainingDaysPerWeek: 4,
        },
      },
    },
  })

  const bob = await prisma.user.upsert({
    where: { email: 'bob@fitcoachai.app' },
    update: {},
    create: {
      email: 'bob@fitcoachai.app',
      name:  'Bob Demo',
      subscription: {
        create: {
          plan:   SubscriptionPlan.FREE,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
          currentPeriodEnd:   new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
      profile: {
        create: {
          firstName:    'Bob',
          age:          35,
          gender:       Gender.MALE,
          weightKg:     88,
          heightCm:     180,
          activityLevel: ActivityLevel.LIGHT,
          fitnessGoals: [FitnessGoal.WEIGHT_LOSS],
          fitnessLevel: FitnessLevel.BEGINNER,
          targetWeightKg: 78,
          trainingDaysPerWeek: 3,
        },
      },
    },
  })

  // --- Coach ---
  const coach = await prisma.user.upsert({
    where: { email: 'coach@fitcoachai.app' },
    update: {},
    create: {
      email: 'coach@fitcoachai.app',
      name:  'Coach Demo',
      subscription: {
        create: {
          plan:   SubscriptionPlan.BUSINESS,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
          currentPeriodEnd:   new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
      coachProfile: {
        create: {
          bio:        'Coach certifié BPJEPS — 10 ans d\'expérience en musculation et nutrition sportive.',
          specialties: ['Musculation', 'Nutrition', 'Perte de poids'],
          hourlyRate:  60,
          isAvailable: true,
        },
      },
    },
  })

  // --- Programme PPL pour Alice ---
  await prisma.workoutProgram.create({
    data: {
      userId:       alice.id,
      name:         'PPL — Prise de masse (4j)',
      description:  'Programme Push/Pull/Legs sur 4 jours adapté à Alice.',
      durationWeeks: 8,
      sessionsPerWeek: 4,
      sessions: {
        create: [
          {
            name:      'Push — Poussée',
            dayOfWeek: 1,
            orderIndex: 0,
            exercises:  {
              create: [
                { exerciseId: 'bench-press',    sets: 4, repsMin: 8,  repsMax: 12, restSeconds: 120, orderIndex: 0 },
                { exerciseId: 'ohp',            sets: 3, repsMin: 8,  repsMax: 12, restSeconds: 90,  orderIndex: 1 },
                { exerciseId: 'tricep-pushdown', sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60,  orderIndex: 2 },
              ],
            },
          },
          {
            name:      'Pull — Tirage',
            dayOfWeek: 3,
            orderIndex: 1,
            exercises:  {
              create: [
                { exerciseId: 'pull-up',        sets: 4, repsMin: 6,  repsMax: 10, restSeconds: 120, orderIndex: 0 },
                { exerciseId: 'barbell-row',    sets: 3, repsMin: 8,  repsMax: 12, restSeconds: 90,  orderIndex: 1 },
                { exerciseId: 'bicep-curl',     sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60,  orderIndex: 2 },
              ],
            },
          },
          {
            name:      'Legs — Jambes',
            dayOfWeek: 5,
            orderIndex: 2,
            exercises:  {
              create: [
                { exerciseId: 'squat',          sets: 4, repsMin: 8,  repsMax: 12, restSeconds: 120, orderIndex: 0 },
                { exerciseId: 'deadlift',       sets: 3, repsMin: 5,  repsMax: 8,  restSeconds: 180, orderIndex: 1 },
                { exerciseId: 'leg-press',      sets: 3, repsMin: 12, repsMax: 15, restSeconds: 90,  orderIndex: 2 },
              ],
            },
          },
        ],
      },
    },
  })

  // --- Body metrics Alice ---
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i * 5)
    await prisma.bodyMetric.create({
      data: {
        userId:   alice.id,
        weightKg: 62 + (6 - i) * 0.2,
        recordedAt: date,
      },
    })
  }

  // --- Produits affiliés ---
  for (const p of AFFILIATE_PRODUCTS) {
    await prisma.affiliateProduct.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id:               p.id,
        name:             p.name,
        brand:            p.brand,
        description:      p.description,
        category:         p.category as AffiliateCategory,
        affiliateUrl:     p.affiliateUrl,
        imageUrl:         p.imageUrl,
        price:            p.price,
        commissionRateMin: p.commissionRateMin,
        commissionRateMax: p.commissionRateMax,
        fitnessGoals:     p.fitnessGoals as FitnessGoal[],
        tags:             p.tags,
      },
    })
  }

  console.log('✅ Seed terminé')
  console.log(`   - Users:    alice, bob, coach`)
  console.log(`   - Programme PPL créé pour alice`)
  console.log(`   - ${AFFILIATE_PRODUCTS.length} produits affiliés insérés`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
