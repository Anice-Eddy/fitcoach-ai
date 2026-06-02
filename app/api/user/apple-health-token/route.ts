export const dynamic = 'force-dynamic'

import { NextResponse }           from 'next/server'
import { auth }                   from '@/lib/auth/auth'
import { getOrCreateAppleHealthToken } from '@/lib/integrations/apple-health-token'

/** Returns the personal Apple Health Shortcut token for the authenticated user. */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const token = await getOrCreateAppleHealthToken(session.user.id)
  return NextResponse.json({ token })
}
