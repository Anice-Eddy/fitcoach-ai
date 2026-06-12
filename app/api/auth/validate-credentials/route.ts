export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma/client'
import { RATE_LIMITS, rateLimitByIp } from '@/lib/security/rate-limit'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

/** Checks email/password credentials without creating a session; returns { valid, reason } for use by the NextAuth credentials provider. */
export async function POST(req: Request) {
  const limited = await rateLimitByIp(req, 'auth:validate-credentials', RATE_LIMITS.auth)
  if (!limited.ok) return limited.response

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ valid: false, reason: 'INVALID_PAYLOAD' }, { status: 422 })
  }

  const user = await prisma.user.findUnique({
    where:  { email: parsed.data.email },
    select: {
      password:     true,
      coachProfile: { select: { id: true } },
      profile:      { select: { id: true } },
    },
  })

  if (!user) {
    return NextResponse.json({ valid: false, reason: 'EMAIL_NOT_FOUND' }, { status: 404 })
  }

  if (!user.password) {
    return NextResponse.json({ valid: false, reason: 'NO_PASSWORD' }, { status: 409 })
  }

  const valid = await compare(parsed.data.password, user.password)
  if (!valid) {
    return NextResponse.json({ valid: false, reason: 'BAD_PASSWORD' }, { status: 401 })
  }

  return NextResponse.json({
    valid:    true,
    isCoach:  !!user.coachProfile,
    isMember: !!user.profile,
  })
}
