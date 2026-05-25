// Connecteur Apple Health — import JSON manuel depuis l'iPhone
import type { NormalizedActivity } from './types'

export function parseAppleHealthExport(json: unknown): NormalizedActivity[] {
  // Phase 2 : parser le format d'export Apple Health (XML → JSON)
  // Pour l'instant retourne des données mockées
  return [
    { date: new Date().toISOString(), steps: 8300, caloriesBurned: 410 },
  ]
}
