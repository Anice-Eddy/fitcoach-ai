// Shared types for all integration connectors.

export interface NormalizedActivity {
  date:          string
  steps?:        number
  caloriesBurned?: number
  heartRateAvg?: number
  activities?:   { name: string; durationMinutes: number; calories: number }[]
}

export interface NormalizedNutritionDay {
  date:       string
  calories?:  number
  proteinG?:  number
  carbsG?:    number
  fatG?:      number
  waterLiters?: number
}

export interface NormalizedBodyComposition {
  date:         string
  weightKg?:    number
  bodyFatPct?:  number
  muscleMassKg?: number
  bmr?:         number
  bioAge?:      number
  bwi?:         number
}

export interface IntegrationConnector {
  service:    string
  label:      string
  logoSrc:    string
  isMocked:   boolean
  connect:    () => Promise<void>
  disconnect: () => Promise<void>
  sync:       () => Promise<NormalizedActivity[]>
}
