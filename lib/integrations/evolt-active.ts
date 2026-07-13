// Evolt Active connector - Phase 1: manual entry.
// Phase 2: Evolt report PDF import | Phase 3: official API.

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

/** Maps an EvoltMeasurement input to a normalized NormalizedBodyComposition record. */
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
