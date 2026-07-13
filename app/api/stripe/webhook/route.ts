export const dynamic = 'force-dynamic'

// POST /api/stripe/webhook - receives and processes Stripe events.
// IMPORTANT: the body must be read as a raw buffer, not JSON.parse

import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import {
  handleCheckoutCompleted,
  handleSubscriptionDeleted,
  handleSubscriptionUpsert,
} from '@/lib/stripe/webhooks'
import type Stripe from 'stripe'

/** Receives Stripe webhook events, verifies the signature, and dispatches to the appropriate handler (checkout, subscription created/updated/deleted). */
export async function POST(req: Request) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
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
        // Unhandled events are ignored silently
        break
    }
  } catch (err) {
    console.error(`[Stripe webhook] Error on ${event.type}:`, err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
