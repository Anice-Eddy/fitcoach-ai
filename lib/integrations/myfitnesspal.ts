// Connecteur MyFitnessPal — mocké MVP, prêt pour un import/export nutritionnel.
import type { IntegrationConnector, NormalizedActivity, NormalizedNutritionDay } from './types'

export const myFitnessPalConnector: IntegrationConnector = {
  service:  'MYFITNESSPAL',
  label:    'MyFitnessPal',
  logoSrc:  '/icons/myfitnesspal.svg',
  isMocked: true,

  connect: async () => {
    // MyFitnessPal ne propose pas d'OAuth public simple pour tous les projets; on garde le flux prêt côté UI.
    throw new Error('Connexion MyFitnessPal disponible prochainement.')
  },

  disconnect: async () => {
    throw new Error('Non connecté.')
  },

  sync: async (): Promise<NormalizedActivity[]> => {
    return [{ date: new Date().toISOString(), caloriesBurned: 260 }]
  },
}

/** Normalise une journée nutrition MyFitnessPal exportée ou importée manuellement. */
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
