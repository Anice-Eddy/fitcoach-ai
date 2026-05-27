// ============================================================
// Conversions d'unités : poids (kg ↔ lb) et taille (cm ↔ ft/pouces)
// Toutes les fonctions sont pures et sans effets de bord
// ============================================================

const KG_TO_LB = 2.20462
const LB_TO_KG = 0.453592
const CM_TO_IN = 0.393701
const IN_TO_CM = 2.54
const INCHES_PER_FOOT = 12

// --- Poids ---

/** Converts kilograms to pounds, rounded to one decimal place. */
export function kgToLb(kg: number): number {
  return Math.round(kg * KG_TO_LB * 10) / 10
}

/** Converts pounds to kilograms, rounded to one decimal place. */
export function lbToKg(lb: number): number {
  return Math.round(lb * LB_TO_KG * 10) / 10
}

// --- Taille ---

export type FeetInches = { feet: number; inches: number }

/** Converts centimetres to feet and inches, handling the 12-inch boundary correctly. */
export function cmToFtIn(cm: number): FeetInches {
  const totalInches = cm * CM_TO_IN
  const feet = Math.floor(totalInches / INCHES_PER_FOOT)
  const inches = Math.round(totalInches % INCHES_PER_FOOT)
  // Gestion du cas 12 pouces → 1 pied supplémentaire
  if (inches === INCHES_PER_FOOT) return { feet: feet + 1, inches: 0 }
  return { feet, inches }
}

/** Converts feet and inches to centimetres, rounded to one decimal place. */
export function ftInToCm(feet: number, inches: number): number {
  const totalInches = feet * INCHES_PER_FOOT + inches
  return Math.round(totalInches * IN_TO_CM * 10) / 10
}

// --- Formatage affichage ---

/** Formats a weight in kg as a display string, converting to lb with suffix when unit is 'LB'. */
export function formatWeight(kg: number, unit: 'KG' | 'LB'): string {
  if (unit === 'KG') return `${kg} kg`
  return `${kgToLb(kg)} lb`
}

/** Formats a height in cm as a display string, converting to ft′in″ when unit is 'FT_IN'. */
export function formatHeight(cm: number, unit: 'CM' | 'FT_IN'): string {
  if (unit === 'CM') return `${cm} cm`
  const { feet, inches } = cmToFtIn(cm)
  return `${feet}'${inches}"`
}

/** Normalizes a weight value to kilograms for database storage, converting from lb when needed. */
export function normalizeWeight(value: number, unit: 'KG' | 'LB'): number {
  return unit === 'KG' ? value : lbToKg(value)
}

/** Normalizes a height value to centimetres for database storage, converting from feet+inches when needed. */
export function normalizeHeight(value: number, unit: 'CM' | 'FT_IN', inches?: number): number {
  if (unit === 'CM') return value
  return ftInToCm(value, inches ?? 0)
}
