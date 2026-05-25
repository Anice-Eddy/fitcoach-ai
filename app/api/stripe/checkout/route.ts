// POST /api/stripe/checkout — crée une session Stripe Checkout
// Rate limiting implicite via Stripe (retries + idempotency)

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/auth'
import { stripe } from '@/lib/stripe/client'
import { prisma } from '@/lib/prisma/client'

const schema = z.object({
  priceId:  z.string().min(1),
  interval: z.enum(['month', 'year']),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 422 })

  const { priceId } = parsed.data
  const userId      = session.user.id
  const appUrl      = process.env.NEXT_PUBLIC_APP_URL!

  // Récupère ou crée le customer Stripe
  const user = await prisma.user.findUnique({ where: { id: userId } })
  let customerId = user?.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email:    session.user.email!,
      name:     session.user.name ?? undefined,
      metadata: { userId },
    })
    customerId = customer.id
    await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } })
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer:           customerId,
    mode:               'subscription',
    payment_method_types: ['card'],
    line_items:         [{ price: priceId, quantity: 1 }],
    success_url:        `${appUrl}/settings?checkout=success`,
    cancel_url:         `${appUrl}/pricing?checkout=canceled`,
    metadata:           { userId },
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { userId },
      trial_period_days: 7,
    },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
