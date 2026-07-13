// Pricing plan definitions: single source of truth.
// Used by /pricing, webhooks, and premium middleware.

import type { PricingPlan } from '@/types'

export const PLANS: PricingPlan[] = [
  {
    id:           'free',
    name:         'Free',
    plan:         'FREE',
    monthlyPrice: 0,
    yearlyPrice:  0,
    description:  'Explore BodyOps with no commitment',
    highlighted:  false,
    features: [
      'Complete profile (BMI, calories, macros)',
      '1 basic workout program',
      '3-day nutrition plan',
      'Local storage only',
      '1 external integration',
    ],
  },
  {
    id:           'pro',
    name:         'Pro',
    plan:         'PRO',
    monthlyPrice: 9.99,
    yearlyPrice:  79,
    description:  'For serious athletes who want steady progress',
    highlighted:  true,
    stripePriceIdMonthly: process.env.STRIPE_PRO_MONTHLY_ID ?? 'price_pro_monthly',
    stripePriceIdYearly:  process.env.STRIPE_PRO_YEARLY_ID ?? 'price_pro_yearly',
    features: [
      'Unlimited programs',
      '7-day nutrition plan + shopping list',
      'Multi-device cloud sync',
      'Unlimited PDF exports',
      'All integrations (Strava, Fitbit, Garmin...)',
      'Advanced tracking + charts',
    ],
  },
  {
    id:           'elite',
    name:         'Elite',
    plan:         'ELITE',
    monthlyPrice: 19.99,
    yearlyPrice:  159,
    description:  'For members who want maximum performance',
    highlighted:  false,
    stripePriceIdMonthly: process.env.STRIPE_ELITE_MONTHLY_ID ?? 'price_elite_monthly',
    stripePriceIdYearly:  process.env.STRIPE_ELITE_YEARLY_ID ?? 'price_elite_yearly',
    features: [
      'Everything in Pro',
      'Automatic AI program adjustments',
      'Early access to new features',
      'Priority support',
    ],
  },
  {
    id:           'business',
    name:         'Business',
    plan:         'BUSINESS',
    monthlyPrice: 199,
    yearlyPrice:  1990,
    description:  'For coaches and gyms, coming soon',
    highlighted:  false,
    stripePriceIdMonthly: process.env.STRIPE_BUSINESS_ID ?? 'price_business',
    features: [
      'Everything in Elite',
      'Coach dashboard with member tracking',
      'Personalized programs per member',
      'Advanced reports and analytics',
      'Integration API',
    ],
  },
]

/** Finds the PricingPlan whose monthly or yearly Stripe price ID matches the given priceId. */
export function getPlanByPriceId(priceId: string): PricingPlan | undefined {
  return PLANS.find(
    (p) => p.stripePriceIdMonthly === priceId || p.stripePriceIdYearly === priceId,
  )
}

/** Finds the PricingPlan whose id field matches the given planId. */
export function getPlanById(planId: string): PricingPlan | undefined {
  return PLANS.find((p) => p.id === planId)
}
