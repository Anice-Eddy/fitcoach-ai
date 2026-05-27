export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AIService } from '@/lib/ai/ai-service'
import { aiError, getAIAccess } from '@/app/api/ai/_utils'

const schema = z.object({ memberId: z.string().optional().nullable() })
const service = new AIService()

/** Generates an AI member analysis covering current level, strengths, weaknesses, and training/nutrition consistency for the given member. */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { access, error } = await getAIAccess(parsed.data.memberId)
  if (error) return error

  try {
    const result = await service.generateReport(
      access!,
      'MEMBER_ANALYSIS',
      'PROGRESSION',
      [
        'Génère une analyse automatique du profil member.',
        'Inclure: niveau actuel, points forts, points faibles, risques de stagnation, cohérence entraînement/nutrition/objectifs.',
      ].join(' '),
    )
    return NextResponse.json(result)
  } catch (err) {
    return aiError(err)
  }
}
