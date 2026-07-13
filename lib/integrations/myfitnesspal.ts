// MyFitnessPal connector: mocked MVP, ready for nutrition import/export.
import type { IntegrationConnector, NormalizedActivity, NormalizedNutritionDay } from './types'

export const myFitnessPalConnector: IntegrationConnector = {
  service:  'MYFITNESSPAL',
  label:    'MyFitnessPal',
  logoSrc:  '/icons/myfitnesspal.svg',
  isMocked: true,

  connect: async () => {
    // MyFitnessPal does not provide simple public OAuth for every project; keep the UI flow ready.
    throw new Error('MyFitnessPal connection is coming soon.')
  },

  disconnect: async () => {
    throw new Error('Not connected.')
  },

  sync: async (): Promise<NormalizedActivity[]> => {
    return [{ date: new Date().toISOString(), caloriesBurned: 260 }]
  },
}

/** Normalizes a MyFitnessPal nutrition day exported or imported manually. */
export function normalizeMyFitnessPalDay(input: Partial<NormalizedNutritionDay>): NormalizedNutritionDay {
  return {
    date:        input.date ?? new Date().toISOString(),
    calories:    input.calories,
    proteinG:    input.proteinG,
    carbsG:      input.carbsG,
    fatG:        input.fatG,
    waterLiters: input.waterLiters,
  }
}
