// ============================================================
// Types TypeScript centralisés — BodyOps AI
// Tous les types partagés entre composants, stores et API
// ============================================================

// --- Enums miroir (évite d'importer @prisma/client côté client) ---

export type Gender         = 'MALE' | 'FEMALE'
export type ActivityLevel  = 'SEDENTARY' | 'LIGHTLY_ACTIVE' | 'MODERATELY_ACTIVE' | 'VERY_ACTIVE' | 'EXTREMELY_ACTIVE'
export type FitnessGoal    = 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'MAINTENANCE' | 'ENDURANCE' | 'FLEXIBILITY' | 'GENERAL_FITNESS'
export type FitnessLevel   = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ATHLETE'
export type WeightUnit     = 'KG' | 'LB'
export type HeightUnit     = 'CM' | 'FT_IN'
export type WorkoutStatus  = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
export type MealType       = 'BREAKFAST' | 'MORNING_SNACK' | 'LUNCH' | 'PRE_WORKOUT' | 'DINNER' | 'POST_WORKOUT'
export type Plan           = 'FREE' | 'PRO' | 'ELITE' | 'BUSINESS'
export type SubStatus      = 'ACTIVE' | 'INACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING'
export type MuscleGroup    = 'CHEST' | 'BACK' | 'SHOULDERS' | 'BICEPS' | 'TRICEPS' | 'FOREARMS' | 'CORE' | 'QUADS' | 'HAMSTRINGS' | 'GLUTES' | 'CALVES' | 'FULL_BODY' | 'CARDIO'
export type Equipment      = 'BARBELL' | 'DUMBBELL' | 'KETTLEBELL' | 'RESISTANCE_BAND' | 'PULL_UP_BAR' | 'BENCH' | 'CABLE_MACHINE' | 'SMITH_MACHINE' | 'BODYWEIGHT' | 'CARDIO_MACHINE' | 'CHEST_PRESS_MACHINE' | 'HIP_THRUST_MACHINE'
export type AffiliateCategory = 'SUPPLEMENTS' | 'EQUIPMENT' | 'CLOTHING' | 'BOOKS'
export type AffiliateMarket   = 'FR' | 'CA'
export type IntegrationService = 'GOOGLE_FIT' | 'STRAVA' | 'FITBIT' | 'GARMIN' | 'APPLE_HEALTH' | 'MYFITNESSPAL' | 'EVOLT_ACTIVE'
export type ExportType     = 'PDF_TRAINING' | 'PDF_NUTRITION' | 'PDF_PROFILE' | 'JSON_ALL'

// --- Fitness ---

export interface BMICategory {
  label: string
  color: string
  range: string
}

export interface FitnessProfileResult {
  bmi:                 number
  bmiCategory:         BMICategory
  bmr:                 number
  tdee:                number
  recommendedCalories: number
  proteinG:            number
  carbsG:              number
  fatG:                number
}

export interface Macros {
  proteinG: number
  carbsG:   number
  fatG:     number
}

// --- Exercices ---

export interface Exercise {
  id:           string
  name:         string
  description?: string
  instructions: string[]
  muscleGroups: MuscleGroup[]
  equipment:    Equipment[]
  imageUrl?:    string
  videoUrl?:    string
  isCompound:   boolean
}

export interface ExerciseSet {
  sets:        number
  reps:        number
  weightKg:    number | null
  restSeconds: number
  tempo?:      string
  rpe?:        number
  isCompleted: boolean
}

export interface SessionExercise extends Exercise {
  order:       number
  sets:        number
  reps:        number
  weightKg:    number | null
  restSeconds: number
  tempo?:      string
  isCompleted: boolean
}

export interface WorkoutSession {
  id:              string
  name:            string
  dayOfWeek?:      number
  weekNumber?:     number
  scheduledAt?:    string
  durationMinutes?: number
  status:          WorkoutStatus
  exercises:       SessionExercise[]
  caloriesBurned?: number
}

export interface WorkoutProgram {
  id:          string
  name:        string
  description?: string
  fitnessGoal: FitnessGoal
  fitnessLevel: FitnessLevel
  weeksTotal:  number
  currentWeek: number
  isActive:    boolean
  sessions:    WorkoutSession[]
}

// --- Nutrition ---

export interface FoodItem {
  id:          string
  name:        string
  brand?:      string
  gramsAmount: number
  calories:    number
  proteinG:    number
  carbsG:      number
  fatG:        number
  fiberG?:     number
  affiliateProductId?: string
}

export interface Meal {
  id:            string
  dayOfWeek:     number
  type:          MealType
  name:          string
  scheduledTime?: string
  totalCalories: number
  totalProteinG: number
  totalCarbsG:   number
  totalFatG:     number
  isLogged:      boolean
  foodItems:     FoodItem[]
}

export interface NutritionPlan {
  id:              string
  name:            string
  targetCalories:  number
  targetProteinG:  number
  targetCarbsG:    number
  targetFatG:      number
  weekStartDate:   string
  isActive:        boolean
  meals:           Meal[]
}

export interface ShoppingItem {
  name:          string
  amount:        number
  unit:          string
  category:      string
  checked:       boolean
  affiliateUrl?: string
}

// --- Affiliation ---

export interface AffiliateProduct {
  id:               string
  name:             string
  brand?:           string
  description?:     string
  category:         AffiliateCategory
  affiliateUrl:     string
  imageUrl?:        string
  price?:           number
  commissionRateMin: number
  commissionRateMax: number
  fitnessGoals:     FitnessGoal[]
  tags:             string[]
}

// --- Intégrations ---

export interface IntegrationStatus {
  id:          string
  service:     IntegrationService
  isConnected: boolean
  lastSyncedAt?: string
  label:       string
  description: string
  logoSrc:     string
  isMocked:    boolean
}

// --- Navigation ---

export interface NavItem {
  href:   string
  label:  string
  icon:   string
  badge?: number
}

// --- API responses ---

export interface ApiSuccess<T> {
  data:    T
  message?: string
}

export interface ApiError {
  error:   string
  code?:   string
  details?: unknown
}

// --- Pricing ---

export interface PricingPlan {
  id:          string
  name:        string
  plan:        Plan
  monthlyPrice: number
  yearlyPrice:  number
  description: string
  features:    string[]
  highlighted: boolean
  stripePriceIdMonthly?: string
  stripePriceIdYearly?:  string
}
