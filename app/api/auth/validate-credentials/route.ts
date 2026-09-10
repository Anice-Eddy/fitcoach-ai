export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma/client'
import { rateLimitResponse } from '@/lib/security/rate-limit'
import { DUMMY_PASSWORD_HASH } from '@/lib/security/password'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

/** Checks email/password credentials without creating a session; returns { valid, reason } for use by the NextAuth credentials provider. */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ valid: false, reason: 'INVALID_PAYLOAD' }, { status: 422 })
  }

  const ipLimit = await rateLimitResponse(req, {
    scope: 'auth.credentials.ip',
    limit: 20,
    windowMs: 10 * 60 * 1000,
  })
  if (ipLimit) return ipLimit

  const emailLimit = await rateLimitResponse(req, {
    scope: 'auth.credentials.email',
    identifier: `email:${parsed.data.email.trim().toLowerCase()}`,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  })
  if (emailLimit) return emailLimit

  const user = await prisma.user.findUnique({
    where:  { email: parsed.data.email },
    select: {
      password:     true,
      coachProfile: { select: { id: true } },
      profile:      { select: { id: true } },
    },
  })

  const valid = await compare(parsed.data.password, user?.password ?? DUMMY_PASSWORD_HASH)
  if (!user?.password || !valid) {
    return NextResponse.json({ valid: false, reason: 'INVALID_CREDENTIALS' }, { status: 401 })
  }

  return NextResponse.json({
    valid:    true,
    isCoach:  !!user.coachProfile,
    isMember: !!user.profile,
  })
}
