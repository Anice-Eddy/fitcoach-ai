export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AIService } from '@/lib/ai/ai-service'
import { aiError, getAIAccess } from '@/app/api/ai/_utils'

const schema = z.object({ memberId: z.string().min(1) })
const service = new AIService()

/** Generates a full AI coach-report for the given memberId; restricted to coach role. */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { access, error } = await getAIAccess(parsed.data.memberId)
  if (error) return error
  if (access!.role !== 'coach') {
    return NextResponse.json({ error: 'Réservé aux coachs pour un membre assigné.' }, { status: 403 })
  }

  try {
    const result = await service.generateReport(
      access!,
      'COACH_REPORT',
      'COACH_REPORT',
      [
        'Génère une synthèse complète pour le coach.',
        'Inclure résumé de progression, problèmes, recommandations, priorités et prochaines actions.',
      ].join(' '),
    )
    return NextResponse.json(result)
  } catch (err) {
    return aiError(err)
  }
}
