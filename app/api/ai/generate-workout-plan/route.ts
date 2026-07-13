export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AIService } from '@/lib/ai/ai-service'
import { aiError, getAIAccess } from '@/app/api/ai/_utils'

const schema = z.object({ memberId: z.string().optional().nullable() })
const service = new AIService()

/** Generates a personalized AI workout plan proposal for the user or member; returns exercises, sets, reps, rest times, and progression rationale. */
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
        'Generate a personalized workout program proposal.',
        'Include exercises, sets, reps, rest times, proposed progression, and rationale.',
        'The coach must be able to validate or edit before sending, so present the plan as a proposal.',
      ].join(' '),
    )
    return NextResponse.json(result)
  } catch (err) {
    return aiError(err)
  }
}
