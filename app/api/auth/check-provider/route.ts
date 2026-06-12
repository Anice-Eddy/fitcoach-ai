export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { RATE_LIMITS, rateLimitByIp } from '@/lib/security/rate-limit'

// Returns the auth provider for an email — used in signin to show a helpful error
// Not a security risk: only reveals provider type, not account existence
/** Returns the auth provider for the given email query param; returns null if no account exists. */
export async function GET(req: NextRequest) {
  const limited = await rateLimitByIp(req, 'auth:check-provider', RATE_LIMITS.auth)
  if (!limited.ok) return limited.response

  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ provider: null })

  const user = await prisma.user.findUnique({
    where:  { email },
    select: { provider: true, password: true },
  })

  if (!user) return NextResponse.json({ provider: null })
  if (!user.password && user.provider === 'GOOGLE') return NextResponse.json({ provider: 'GOOGLE' })
  if (!user.password && user.provider === 'FACEBOOK') return NextResponse.json({ provider: 'FACEBOOK' })
  if (!user.password && user.provider === 'GITHUB') return NextResponse.json({ provider: 'GITHUB' })
  return NextResponse.json({ provider: 'EMAIL' })
}
