// Connecteur Apple Health — import JSON manuel depuis l'iPhone
import type { NormalizedActivity } from './types'

/** Parses an Apple Health JSON export into normalized activity records; returns mock data until Phase 2 parsing is implemented. */
export function parseAppleHealthExport(_json: unknown): NormalizedActivity[] {
  // Phase 2 : parser le format d'export Apple Health (XML → JSON)
  // Pour l'instant retourne des données mockées
  return [
    { date: new Date().toISOString(), steps: 8300, caloriesBurned: 410 },
  ]
}
