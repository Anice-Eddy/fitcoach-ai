// JSON import with Zod validation before applying data.
import { z } from 'zod'

const importSchema = z.object({
  version:    z.literal('1.0'),
  exportedAt: z.string(),
  profile:    z.unknown().nullable(),
  metrics:    z.array(z.unknown()),
})

export type ImportPayload = z.infer<typeof importSchema>

/** Validates an unknown value against the import schema; returns success with typed data or an error message. */
export function validateImport(raw: unknown): { success: true; data: ImportPayload } | { success: false; error: string } {
  const result = importSchema.safeParse(raw)
  if (!result.success) {
    return { success: false, error: 'Invalid file or incompatible version.' }
  }
  return { success: true, data: result.data }
}

/** Reads a File as text and parses it as JSON; rejects with a descriptive error on read failure or invalid JSON. */
export async function readJsonFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = (e) => { try { resolve(JSON.parse(e.target?.result as string)) } catch { reject(new Error('Invalid JSON')) } }
    reader.onerror = () => reject(new Error('Read error'))
    reader.readAsText(file)
  })
}
