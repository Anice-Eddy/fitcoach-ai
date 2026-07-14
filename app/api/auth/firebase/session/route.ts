export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireFirebaseUser } from '@/lib/firebase/server-auth'
import { prisma } from '@/lib/prisma/client'
import { isLegalAcceptanceComplete, userLegalAcceptanceData } from '@/lib/legal/consent'
import { legalAcceptanceBodySchema } from '@/lib/legal/validation'

/** Verifies a Firebase ID token and links/creates the matching BodyOps user. */
export async function POST(req: NextRequest) {

  const result = await requireFirebaseUser(req)
  if (result.error) return result.error

  const body = legalAcceptanceBodySchema.safeParse(await req.json().catch(() => null))
  const legalAcceptance = body.success ? body.data?.legalAcceptance : undefined
  const { user, decoded } = result
  const legalData = isLegalAcceptanceComplete(legalAcceptance)
    ? userLegalAcceptanceData(legalAcceptance)
    : null
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

  if (legalData) {
    await prisma.user.update({
      where: { id: user.id },
      data: legalData,
    })
  }

  await prisma.authHandoffToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  })

  return NextResponse.json({
    firebaseSessionToken: token,
    expiresAt: expiresAt.toISOString(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      isCoach: Boolean(user.coachProfile),
      hasMemberProfile: Boolean(user.profile),
      firebaseUid: user.firebaseUid,
      authProvider: user.authProvider,
      emailVerified: decoded.email_verified === true,
    },
  })
}
