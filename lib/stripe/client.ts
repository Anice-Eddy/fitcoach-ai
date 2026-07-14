import Stripe from 'stripe'

let cachedStripe: Stripe | null = null

/** Lazily creates the Stripe client so builds can succeed when payments are disabled or not configured yet. */
export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }

  cachedStripe ??= new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia',
    typescript:  true,
  })

  return cachedStripe
}
