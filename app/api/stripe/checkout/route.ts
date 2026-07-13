export const dynamic = 'force-dynamic'

// POST /api/stripe/checkout - temporarily disabled.

import { NextResponse } from 'next/server'

/** Placeholder for Stripe checkout session creation; currently disabled and returns 503. */
export async function POST(_req: Request) {
  return NextResponse.json({ error: 'Payments are coming soon' }, { status: 503 })
}
