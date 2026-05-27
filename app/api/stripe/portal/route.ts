export const dynamic = 'force-dynamic'

// POST /api/stripe/portal — désactivé temporairement

import { NextResponse } from 'next/server'

/** Placeholder for Stripe billing portal session creation; currently disabled and returns 503. */
export async function POST() {
  return NextResponse.json({ error: 'Paiements bientôt disponibles' }, { status: 503 })
}
