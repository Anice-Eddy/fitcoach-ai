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

export function kgToLb(kg: number): number {
  return Math.round(kg * KG_TO_LB * 10) / 10
}

export function lbToKg(lb: number): number {
  return Math.round(lb * LB_TO_KG * 10) / 10
}

// --- Taille ---

export type FeetInches = { feet: number; inches: number }

export function cmToFtIn(cm: number): FeetInches {
  const totalInches = cm * CM_TO_IN
  const feet = Math.floor(totalInches / INCHES_PER_FOOT)
  const inches = Math.round(totalInches % INCHES_PER_FOOT)
  // Gestion du cas 12 pouces → 1 pied supplémentaire
  if (inches === INCHES_PER_FOOT) return { feet: feet + 1, inches: 0 }
  return { feet, inches }
}

export function ftInToCm(feet: number, inches: number): number {
  const totalInches = feet * INCHES_PER_FOOT + inches
  return Math.round(totalInches * IN_TO_CM * 10) / 10
}

// --- Formatage affichage ---

export function formatWeight(kg: number, unit: 'KG' | 'LB'): string {
  if (unit === 'KG') return `${kg} kg`
  return `${kgToLb(kg)} lb`
}

export function formatHeight(cm: number, unit: 'CM' | 'FT_IN'): string {
  if (unit === 'CM') return `${cm} cm`
  const { feet, inches } = cmToFtIn(cm)
  return `${feet}'${inches}"`
}

// Normalise toujours vers kg/cm pour la BDD quel que soit l'unité de saisie
export function normalizeWeight(value: number, unit: 'KG' | 'LB'): number {
  return unit === 'KG' ? value : lbToKg(value)
}

export function normalizeHeight(value: number, unit: 'CM' | 'FT_IN', inches?: number): number {
  if (unit === 'CM') return value
  return ftInToCm(value, inches ?? 0)
}
