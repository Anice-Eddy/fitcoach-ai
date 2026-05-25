// Seed Prisma — utilisateurs demo + produits affiliés
// Exécution : npx prisma db seed

import { PrismaClient, SubscriptionPlan, SubscriptionStatus, Gender, ActivityLevel, FitnessGoal, FitnessLevel, AffiliateCategory, WeightUnit, HeightUnit } from '@prisma/client'
import { AFFILIATE_PRODUCTS } from '../lib/affiliates/products'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // --- Exercises (bibliothèque partagée) ---
  const exerciseData = [
    { id: 'ex-bench-press',  name: 'Développé couché',    instructions: ['Allongez-vous sur le banc.', 'Saisissez la barre à largeur d\'épaules.', 'Descendez jusqu\'à la poitrine.', 'Poussez vers le haut.'],             muscleGroups: ['CHEST', 'TRICEPS', 'SHOULDERS'], equipment: ['BARBELL', 'BENCH'], isCompound: true },
    { id: 'ex-squat',        name: 'Squat barre',          instructions: ['Barre sur les trapèzes.', 'Pieds à largeur d\'épaules.', 'Descendez dos droit.', 'Remontez en poussant sur les talons.'],                     muscleGroups: ['QUADS', 'GLUTES', 'HAMSTRINGS'], equipment: ['BARBELL'],        isCompound: true },
    { id: 'ex-deadlift',     name: 'Soulevé de terre',     instructions: ['Pieds sous la barre.', 'Saisissez en pronation.', 'Dos droit, barre contre les tibias.', 'Poussez le sol et levez.'],                         muscleGroups: ['BACK', 'HAMSTRINGS', 'GLUTES'],   equipment: ['BARBELL'],        isCompound: true },
    { id: 'ex-pull-up',      name: 'Tractions',            instructions: ['Saisissez la barre en pronation.', 'Partez bras tendus.', 'Tirez jusqu\'au menton au-dessus.', 'Redescendez de manière contrôlée.'],           muscleGroups: ['BACK', 'BICEPS'],                 equipment: ['PULL_UP_BAR'],    isCompound: true },
    { id: 'ex-ohp',          name: 'Développé militaire',  instructions: ['Barre au niveau de la clavicule.', 'Poussez au-dessus de la tête.', 'Contractez les abdos.', 'Descendez de manière contrôlée.'],               muscleGroups: ['SHOULDERS', 'TRICEPS'],           equipment: ['BARBELL'],        isCompound: true },
    { id: 'ex-barbell-row',  name: 'Rowing barre',         instructions: ['Penchez le buste à 45°.', 'Tirez la barre vers le nombril.', 'Serrez les omoplates.', 'Redescendez lentement.'],                             muscleGroups: ['BACK', 'BICEPS'],                 equipment: ['BARBELL'],        isCompound: true },
    { id: 'ex-dip',          name: 'Dips triceps',         instructions: ['Mains sur les barres parallèles.', 'Descendez jusqu\'à 90°.', 'Poussez vers le haut en contractant les triceps.'],                            muscleGroups: ['TRICEPS', 'CHEST'],               equipment: ['BODYWEIGHT'],     isCompound: false },
    { id: 'ex-bicep-curl',   name: 'Curl biceps',          instructions: ['Haltères le long du corps.', 'Fléchissez les coudes.', 'Montez jusqu\'aux épaules.', 'Redescendez lentement.'],                              muscleGroups: ['BICEPS'],                         equipment: ['DUMBBELL'],       isCompound: false },
    { id: 'ex-leg-press',    name: 'Presse à cuisses',     instructions: ['Dos bien calé contre le dossier.', 'Pieds à largeur d\'épaules sur la plateforme.', 'Fléchissez les genoux à 90°.', 'Poussez la charge.'],    muscleGroups: ['QUADS', 'GLUTES'],                equipment: ['CABLE_MACHINE'],  isCompound: true },
    { id: 'ex-lunge',        name: 'Fentes avant',         instructions: ['Debout, pieds joints.', 'Avancez un pied et fléchissez les deux genoux.', 'Le genou arrière frôle le sol.', 'Revenez en position initiale.'], muscleGroups: ['QUADS', 'GLUTES', 'HAMSTRINGS'], equipment: ['BODYWEIGHT'],     isCompound: true },
  ] as const

  for (const ex of exerciseData) {
    await prisma.exercise.upsert({
      where:  { id: ex.id },
      update: {},
      create: {
        id:           ex.id,
        name:         ex.name,
        instructions: [...ex.instructions],
        muscleGroups: { set: [...ex.muscleGroups] },
        equipment:    { set: [...ex.equipment] },
        isCompound:   ex.isCompound,
      },
    })
  }

  // --- User Alice (Pro) ---
  const alice = await prisma.user.upsert({
    where:  { email: 'alice@fitcoachai.app' },
    update: {},
    create: {
      email: 'alice@fitcoachai.app',
      name:  'Alice Demo',
      subscription: {
        create: {
          plan:   SubscriptionPlan.PRO,
          status: SubscriptionStatus.ACTIVE,
          stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
      profile: {
        create: {
          firstName:           'Alice',
          age:                 28,
          gender:              Gender.FEMALE,
          weightKg:            62,
          heightCm:            167,
          weightUnit:          WeightUnit.KG,
          heightUnit:          HeightUnit.CM,
          activityLevel:       ActivityLevel.MODERATELY_ACTIVE,
          availableEquipment:  ['BARBELL', 'DUMBBELL', 'BENCH'],
          trainingDaysPerWeek: 4,
          fitnessGoal:         FitnessGoal.MUSCLE_GAIN,
          fitnessLevel:        FitnessLevel.INTERMEDIATE,
          targetWeightKg:      66,
          dietaryRestrictions: [],
          foodPreferences:     ['HIGH_PROTEIN'],
          onboardingCompleted: true,
        },
      },
    },
  })

  // --- User Bob (Free) ---
  await prisma.user.upsert({
    where:  { email: 'bob@fitcoachai.app' },
    update: {},
    create: {
      email: 'bob@fitcoachai.app',
      name:  'Bob Demo',
      subscription: {
        create: {
          plan:   SubscriptionPlan.FREE,
          status: SubscriptionStatus.ACTIVE,
          stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
      profile: {
        create: {
          firstName:           'Bob',
          age:                 35,
          gender:              Gender.MALE,
          weightKg:            88,
          heightCm:            180,
          weightUnit:          WeightUnit.KG,
          heightUnit:          HeightUnit.CM,
          activityLevel:       ActivityLevel.LIGHTLY_ACTIVE,
          availableEquipment:  ['DUMBBELL', 'BODYWEIGHT'],
          trainingDaysPerWeek: 3,
          fitnessGoal:         FitnessGoal.WEIGHT_LOSS,
          fitnessLevel:        FitnessLevel.BEGINNER,
          targetWeightKg:      78,
          dietaryRestrictions: ['GLUTEN_FREE'],
          foodPreferences:     [],
          onboardingCompleted: true,
        },
      },
    },
  })

  // --- Coach (Business) ---
  await prisma.user.upsert({
    where:  { email: 'coach@fitcoachai.app' },
    update: {},
    create: {
      email: 'coach@fitcoachai.app',
      name:  'Coach Demo',
      subscription: {
        create: {
          plan:   SubscriptionPlan.BUSINESS,
          status: SubscriptionStatus.ACTIVE,
          stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
      coachProfile: {
        create: {
          bio:        'Coach certifié BPJEPS — 10 ans d\'expérience en musculation et nutrition sportive.',
          specialties: ['Musculation', 'Nutrition', 'Perte de poids'],
          isVerified: true,
          memberLimit: 30,
        },
      },
    },
  })

  // --- Body metrics Alice (30 jours) ---
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    await prisma.bodyMetric.create({
      data: {
        userId:   alice.id,
        date:     d,
        weightKg: 62 + (29 - i) * 0.07 + (Math.random() - 0.5) * 0.3,
      },
    })
  }

  // --- Workout program PPL pour Alice ---
  const program = await prisma.workoutProgram.create({
    data: {
      userId:       alice.id,
      name:         'PPL — Prise de masse (4j)',
      description:  'Programme Push/Pull/Legs sur 4 jours adapté à Alice.',
      fitnessGoal:  FitnessGoal.MUSCLE_GAIN,
      fitnessLevel: FitnessLevel.INTERMEDIATE,
      weeksTotal:   8,
      currentWeek:  1,
      isActive:     true,
    },
  })

  // Push session
  const pushSession = await prisma.workoutSession.create({
    data: {
      userId:    alice.id,
      programId: program.id,
      name:      'Push — Poussée',
      dayOfWeek: 1,
      weekNumber: 1,
      status:    'PLANNED',
    },
  })

  await prisma.exerciseLog.createMany({
    data: [
      { sessionId: pushSession.id, exerciseId: 'ex-bench-press', order: 0, sets: 4, reps: 10, weightKg: 60, restSeconds: 120, isCompleted: false },
      { sessionId: pushSession.id, exerciseId: 'ex-ohp',         order: 1, sets: 3, reps: 10, weightKg: 40, restSeconds: 90,  isCompleted: false },
      { sessionId: pushSession.id, exerciseId: 'ex-dip',         order: 2, sets: 3, reps: 12, weightKg: null, restSeconds: 60, isCompleted: false },
    ],
  })

  // Pull session
  const pullSession = await prisma.workoutSession.create({
    data: {
      userId:    alice.id,
      programId: program.id,
      name:      'Pull — Tirage',
      dayOfWeek: 3,
      weekNumber: 1,
      status:    'PLANNED',
    },
  })

  await prisma.exerciseLog.createMany({
    data: [
      { sessionId: pullSession.id, exerciseId: 'ex-pull-up',     order: 0, sets: 4, reps: 8,  weightKg: null, restSeconds: 120, isCompleted: false },
      { sessionId: pullSession.id, exerciseId: 'ex-barbell-row', order: 1, sets: 3, reps: 10, weightKg: 50,   restSeconds: 90,  isCompleted: false },
      { sessionId: pullSession.id, exerciseId: 'ex-bicep-curl',  order: 2, sets: 3, reps: 12, weightKg: 12,   restSeconds: 60,  isCompleted: false },
    ],
  })

  // Legs session
  const legsSession = await prisma.workoutSession.create({
    data: {
      userId:    alice.id,
      programId: program.id,
      name:      'Legs — Jambes',
      dayOfWeek: 5,
      weekNumber: 1,
      status:    'PLANNED',
    },
  })

  await prisma.exerciseLog.createMany({
    data: [
      { sessionId: legsSession.id, exerciseId: 'ex-squat',     order: 0, sets: 4, reps: 8,  weightKg: 80,  restSeconds: 180, isCompleted: false },
      { sessionId: legsSession.id, exerciseId: 'ex-deadlift',  order: 1, sets: 3, reps: 6,  weightKg: 100, restSeconds: 180, isCompleted: false },
      { sessionId: legsSession.id, exerciseId: 'ex-leg-press', order: 2, sets: 3, reps: 12, weightKg: 120, restSeconds: 90,  isCompleted: false },
    ],
  })

  // --- Produits affiliés ---
  for (const p of AFFILIATE_PRODUCTS) {
    await prisma.affiliateProduct.upsert({
      where:  { id: p.id },
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
  console.log(`   - 10 exercices créés`)
  console.log(`   - Users : alice (Pro), bob (Free), coach (Business)`)
  console.log(`   - Programme PPL Alice (3 séances, 9 exerciseLogs)`)
  console.log(`   - 30 métriques poids Alice`)
  console.log(`   - ${AFFILIATE_PRODUCTS.length} produits affiliés`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
