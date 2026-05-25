// ============================================================
// Schémas Zod pour l'onboarding et les API routes
// Chaque étape du stepper a son propre schéma partiel
// deps: npm install zod
// ============================================================

import { z } from 'zod'

// --- Étape 1 : Identité ---

export const identitySchema = z.object({
  firstName: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères')
    .trim(),
  age: z
    .number({ invalid_type_error: 'L\'âge doit être un nombre' })
    .int('L\'âge doit être un entier')
    .min(13, 'Âge minimum : 13 ans')
    .max(100, 'Âge maximum : 100 ans'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], {
    errorMap: () => ({ message: 'Sélectionnez un genre' }),
  }),
})

// --- Étape 2 : Mensurations ---

export const measurementsSchema = z.object({
  weightKg: z
    .number({ invalid_type_error: 'Entrez un poids valide' })
    .min(30, 'Poids minimum : 30 kg')
    .max(300, 'Poids maximum : 300 kg'),
  heightCm: z
    .number({ invalid_type_error: 'Entrez une taille valide' })
    .min(100, 'Taille minimum : 100 cm')
    .max(250, 'Taille maximum : 250 cm'),
  waistCm: z.number().min(40).max(200).optional(),
  hipsCm: z.number().min(40).max(200).optional(),
  weightUnit: z.enum(['KG', 'LB']),
  heightUnit: z.enum(['CM', 'FT_IN']),
})

// --- Étape 3 : Activité ---

export const equipmentEnum = z.enum([
  'BARBELL', 'DUMBBELL', 'KETTLEBELL', 'RESISTANCE_BAND',
  'PULL_UP_BAR', 'BENCH', 'CABLE_MACHINE', 'SMITH_MACHINE',
  'BODYWEIGHT', 'CARDIO_MACHINE',
])

export const activitySchema = z.object({
  activityLevel: z.enum(
    ['SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTREMELY_ACTIVE'],
    { errorMap: () => ({ message: 'Sélectionnez un niveau d\'activité' }) },
  ),
  availableEquipment: z
    .array(equipmentEnum)
    .min(1, 'Sélectionnez au moins un équipement'),
  trainingDaysPerWeek: z
    .number()
    .int()
    .min(1, 'Minimum 1 jour par semaine')
    .max(7, 'Maximum 7 jours par semaine'),
})

// --- Étape 4 : Objectifs ---

export const goalsSchema = z.object({
  fitnessGoal: z.enum(
    ['WEIGHT_LOSS', 'MUSCLE_GAIN', 'MAINTENANCE', 'ENDURANCE', 'FLEXIBILITY', 'GENERAL_FITNESS'],
    { errorMap: () => ({ message: 'Sélectionnez un objectif' }) },
  ),
  targetWeightKg: z.number().min(30).max(300).optional(),
  fitnessLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ATHLETE'], {
    errorMap: () => ({ message: 'Sélectionnez votre niveau' }),
  }),
})

// --- Étape 5 : Alimentation ---

export const dietSchema = z.object({
  dietaryRestrictions: z.array(z.string()).default([]),
  foodPreferences: z.array(z.string()).default([]),
})

// --- Schéma complet onboarding ---

export const onboardingSchema = identitySchema
  .merge(measurementsSchema)
  .merge(activitySchema)
  .merge(goalsSchema)
  .merge(dietSchema)

// --- Schéma API : mise à jour du profil ---

export const updateProfileSchema = onboardingSchema.partial()

// --- Schéma API : ajout d'une métrique corporelle ---

export const bodyMetricSchema = z.object({
  date:         z.coerce.date().optional(),
  weightKg:     z.number().min(30).max(300),
  bodyFatPct:   z.number().min(1).max(70).optional(),
  muscleMassKg: z.number().min(10).max(150).optional(),
  waistCm:      z.number().min(40).max(200).optional(),
  hipsCm:       z.number().min(40).max(200).optional(),
  notes:        z.string().max(500).optional(),
})

// --- Schéma API : tracking clic affilié ---

export const affiliateClickSchema = z.object({
  productId: z.string().min(1, 'ID produit requis'),
  source:    z.string().max(100).optional(),
})

// --- Types inférés ---

export type OnboardingData    = z.infer<typeof onboardingSchema>
export type IdentityData      = z.infer<typeof identitySchema>
export type MeasurementsData  = z.infer<typeof measurementsSchema>
export type ActivityData      = z.infer<typeof activitySchema>
export type GoalsData         = z.infer<typeof goalsSchema>
export type DietData          = z.infer<typeof dietSchema>
export type BodyMetricInput   = z.infer<typeof bodyMetricSchema>
export type AffiliateClickInput = z.infer<typeof affiliateClickSchema>
