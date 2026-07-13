// Apple Health connector - manual JSON import from iPhone.
import type { NormalizedActivity } from './types'

/** Parses an Apple Health JSON export into normalized activity records; returns mock data until Phase 2 parsing is implemented. */
export function parseAppleHealthExport(_json: unknown): NormalizedActivity[] {
  // Phase 2: parse Apple Health export format (XML to JSON).
  // Returns mocked data for now.
  return [
    { date: new Date().toISOString(), steps: 8300, caloriesBurned: 410 },
  ]
}
