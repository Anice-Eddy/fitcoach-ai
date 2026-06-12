export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { authProviderMode } from '@/lib/auth/provider-mode'

export async function GET() {
  return NextResponse.json({ provider: authProviderMode() })
}
