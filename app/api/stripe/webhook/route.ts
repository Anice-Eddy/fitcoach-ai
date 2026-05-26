export const dynamic = 'force-dynamic'

// POST /api/stripe/webhook — reçoit et traite les événements Stripe
// IMPORTANT : le body doit être lu comme raw buffer (pas JSON.parse)

import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import {
  handleCheckoutCompleted,
  handleSubscriptionDeleted,
  handleSubscriptionUpsert,
} from '@/lib/stripe/webhooks'
import type Stripe from 'stripe'

export async function POST(req: Request) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpsert(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      default:
        // Événements non gérés ignorés silencieusement
        break
    }
  } catch (err) {
    console.error(`[Stripe webhook] Erreur sur ${event.type}:`, err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
