export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AIService } from '@/lib/ai/ai-service'
import { aiError, getAIAccess } from '@/app/api/ai/_utils'

const schema = z.object({ memberId: z.string().optional().nullable() })
const service = new AIService()

/** Generates an AI nutrition plan for the authenticated user or specified member; returns a non-medical dietary proposal with macros and meal ideas. */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { access, error } = await getAIAccess(parsed.data.memberId)
  if (error) return error

  try {
    const result = await service.generateReport(
      access!,
      'NUTRITION_PLAN',
      'NUTRITION',
      [
        'Génère une proposition nutritionnelle non médicale.',
        'Inclure calories, macros, idées de repas simples, cohérence avec objectif et recommandations pratiques.',
        'Ajouter un disclaimer santé clair.',
      ].join(' '),
    )
    return NextResponse.json(result)
  } catch (err) {
    return aiError(err)
  }
}
