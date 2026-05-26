// Définition des plans tarifaires — source unique de vérité
// Utilisé par /pricing, les webhooks et le middleware premium

import type { PricingPlan } from '@/types'

export const PLANS: PricingPlan[] = [
  {
    id:           'free',
    name:         'Free',
    plan:         'FREE',
    monthlyPrice: 0,
    yearlyPrice:  0,
    description:  'Pour découvrir fitcoach sans engagement',
    highlighted:  false,
    features: [
      'Profil complet (IMC, calories, macros)',
      '1 programme d\'entraînement basique',
      'Plan nutritionnel 3 jours',
      'Stockage local uniquement',
      '1 intégration externe',
    ],
  },
  {
    id:           'pro',
    name:         'Pro',
    plan:         'PRO',
    monthlyPrice: 9.99,
    yearlyPrice:  79,
    description:  'Pour les sportifs sérieux qui veulent progresser',
    highlighted:  true,
    stripePriceIdMonthly: process.env.STRIPE_PRO_MONTHLY_ID,
    stripePriceIdYearly:  process.env.STRIPE_PRO_YEARLY_ID,
    features: [
      'Programmes illimités',
      'Plan nutritionnel 7 jours + liste de courses',
      'Synchronisation cloud multi-device',
      'Export PDF illimité',
      'Toutes les intégrations (Strava, Fitbit, Garmin…)',
      'Suivi avancé + graphiques',
    ],
  },
  {
    id:           'elite',
    name:         'Elite',
    plan:         'ELITE',
    monthlyPrice: 19.99,
    yearlyPrice:  159,
    description:  'Pour les athlètes qui veulent la performance maximale',
    highlighted:  false,
    stripePriceIdMonthly: process.env.STRIPE_ELITE_MONTHLY_ID,
    stripePriceIdYearly:  process.env.STRIPE_ELITE_YEARLY_ID,
    features: [
      'Tout le plan Pro',
      'Ajustements IA automatiques du programme',
      'Accès anticipé aux nouvelles fonctionnalités',
      'Support prioritaire',
    ],
  },
  {
    id:           'business',
    name:         'Entreprise',
    plan:         'BUSINESS',
    monthlyPrice: 199,
    yearlyPrice:  1990,
    description:  'Pour les coachs et les salles de sport (bientôt disponible)',
    highlighted:  false,
    stripePriceIdMonthly: process.env.STRIPE_BUSINESS_ID,
    features: [
      'Tout le plan Elite',
      'Tableau de bord coach avec suivi des membres',
      'Programmes personnalisés par membre',
      'Rapports et analytics avancés',
      'API d\'intégration',
    ],
  },
]

export function getPlanByPriceId(priceId: string): PricingPlan | undefined {
  return PLANS.find(
    (p) => p.stripePriceIdMonthly === priceId || p.stripePriceIdYearly === priceId,
  )
}

export function getPlanById(planId: string): PricingPlan | undefined {
  return PLANS.find((p) => p.id === planId)
}
