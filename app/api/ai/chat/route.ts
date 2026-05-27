export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AIService } from '@/lib/ai/ai-service'
import { agentSchema, aiError, getAIAccess } from '@/app/api/ai/_utils'

const schema = z.object({
  agentType:      agentSchema,
  message:        z.string().min(1).max(2000),
  memberId:       z.string().optional().nullable(),
  conversationId: z.string().optional().nullable(),
  provider:       z.enum(['AUTO', 'GEMINI', 'GROQ']).optional(),
})

const service = new AIService()

/** Runs an AI chat turn for the given agentType and message, enforcing rate-limit and member access; returns the AI response. */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { access, error } = await getAIAccess(parsed.data.memberId)
  if (error) return error

  try {
    const preferred = parsed.data.provider && parsed.data.provider !== 'AUTO'
      ? parsed.data.provider
      : undefined
    const result = await service.chat(
      access!,
      parsed.data.agentType,
      parsed.data.message,
      parsed.data.conversationId,
      preferred,
    )
    return NextResponse.json(result)
  } catch (err) {
    return aiError(err)
  }
}
