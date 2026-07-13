// Versioned and typed JSON export of all user data.

import type { UserProfile } from '@/lib/storage/StorageAdapter'

interface ExportPayload {
  version:   '1.0'
  exportedAt: string
  profile:   UserProfile | null
  metrics:   unknown[]
}

/** Builds a versioned JSON export payload containing the user profile and body metrics. */
export function buildJsonExport(profile: UserProfile | null, metrics: unknown[]): ExportPayload {
  return {
    version:    '1.0',
    exportedAt: new Date().toISOString(),
    profile,
    metrics,
  }
}

/** Triggers a browser download of the given ExportPayload as a JSON file with the specified filename. */
export function downloadJson(data: ExportPayload, filename = 'BodyOps-export.json'): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
