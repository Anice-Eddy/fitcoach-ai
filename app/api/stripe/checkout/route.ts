export const dynamic = 'force-dynamic'

// POST /api/stripe/checkout — désactivé temporairement

import { NextResponse } from 'next/server'

export async function POST(_req: Request) {
  return NextResponse.json({ error: 'Paiements bientôt disponibles' }, { status: 503 })
}
