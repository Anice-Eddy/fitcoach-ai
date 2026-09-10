export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

/** Kept for backward compatibility without disclosing account existence or provider. */
export async function GET() {
  return NextResponse.json(
    { provider: null },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
