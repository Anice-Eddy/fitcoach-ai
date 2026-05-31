export const dynamic = 'force-dynamic'

import { NextResponse }           from 'next/server'
import { auth }                   from '@/lib/auth/auth'
import { generateAppleHealthToken } from '@/lib/integrations/apple-health-token'

/** Returns the personal Apple Health Shortcut token for the authenticated user. */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const token = `${session.user.id}:${generateAppleHealthToken(session.user.id)}`
  return NextResponse.json({ token })
}
