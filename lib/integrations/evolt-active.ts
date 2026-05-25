// Connecteur Evolt Active — Phase 1 : saisie manuelle
// Phase 2 : import PDF rapport Evolt | Phase 3 : API officielle

import type { NormalizedBodyComposition } from './types'

export interface EvoltMeasurement {
  date:         string
  weightKg?:    number
  bodyFatPct?:  number
  muscleMassKg?: number
  bmr?:         number
  bioAge?:      number
  bwi?:         number
}

export function normalizeEvoltData(input: EvoltMeasurement): NormalizedBodyComposition {
  return {
    date:         input.date,
    weightKg:     input.weightKg,
    bodyFatPct:   input.bodyFatPct,
    muscleMassKg: input.muscleMassKg,
    bmr:          input.bmr,
    bioAge:       input.bioAge,
    bwi:          input.bwi,
  }
}
