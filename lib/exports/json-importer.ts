// Import JSON avec validation Zod avant application des données
import { z } from 'zod'

const importSchema = z.object({
  version:    z.literal('1.0'),
  exportedAt: z.string(),
  profile:    z.unknown().nullable(),
  metrics:    z.array(z.unknown()),
})

export type ImportPayload = z.infer<typeof importSchema>

export function validateImport(raw: unknown): { success: true; data: ImportPayload } | { success: false; error: string } {
  const result = importSchema.safeParse(raw)
  if (!result.success) {
    return { success: false, error: 'Fichier invalide ou version incompatible.' }
  }
  return { success: true, data: result.data }
}

export async function readJsonFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = (e) => { try { resolve(JSON.parse(e.target?.result as string)) } catch { reject(new Error('JSON invalide')) } }
    reader.onerror = () => reject(new Error('Erreur de lecture'))
    reader.readAsText(file)
  })
}
