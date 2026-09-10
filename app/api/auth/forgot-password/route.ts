export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimitResponse } from '@/lib/security/rate-limit'

const schema = z.object({
  email: z.string().email(),
  intent: z.enum(['firebase', 'legacy']).optional(),
})

/** Validates that a Firebase password reset can be requested for this BodyOps account. */
export async function POST(req: Request) {
  const body   = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 422 })
  }

  const { email, intent } = parsed.data
  const ipLimit = await rateLimitResponse(req, {
    scope: 'auth.password-reset.ip',
    limit: 10,
    windowMs: 15 * 60 * 1000,
  })
  if (ipLimit) return ipLimit

  const emailLimit = await rateLimitResponse(req, {
    scope: 'auth.password-reset.email',
    identifier: `email:${email.trim().toLowerCase()}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  })
  if (emailLimit) return emailLimit

  if (intent === 'firebase') {
    return NextResponse.json({ ok: true, method: 'firebase-client-email' })
  }

  return NextResponse.json(
    {
      ok: false,
      reason: 'FIREBASE_ONLY',
      message: 'Password reset is now handled by Firebase.',
    },
    { status: 410 },
  )
}
