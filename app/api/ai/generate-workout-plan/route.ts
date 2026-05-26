export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AIService } from '@/lib/ai/ai-service'
import { aiError, getAIAccess } from '@/app/api/ai/_utils'

const schema = z.object({ memberId: z.string().optional().nullable() })
const service = new AIService()

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { access, error } = await getAIAccess(parsed.data.memberId)
  if (error) return error

  try {
    const result = await service.generateReport(
      access!,
      'WORKOUT_PLAN',
      'TRAINING',
      [
        'Génère une proposition de programme personnalisé.',
        'Inclure exercices, séries, répétitions, temps de repos, progression proposée et justification.',
        'Le coach doit pouvoir valider/modifier avant envoi: présente donc le plan comme une proposition.',
      ].join(' '),
    )
    return NextResponse.json(result)
  } catch (err) {
    return aiError(err)
  }
}
