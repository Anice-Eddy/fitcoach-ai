// Client Stripe côté serveur (singleton)
// deps: npm install stripe

import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript:  true,
})
