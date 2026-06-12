export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireFirebaseUser } from '@/lib/firebase/server-auth'

/** Example Firebase-protected route: returns the BodyOps user linked to the verified token. */
export async function GET(req: NextRequest) {
  const result = await requireFirebaseUser(req)
  if (result.error) return result.error

  const { user } = result
  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    plan: user.subscriptionPlan,
    status: user.subscriptionStatus,
    isCoach: Boolean(user.coachProfile),
    hasMemberProfile: Boolean(user.profile),
    authProvider: user.authProvider,
    firebaseUid: user.firebaseUid,
  })
}
