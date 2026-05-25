// Client Stripe côté serveur (singleton)
// deps: npm install stripe

import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
  typescript:  true,
})
