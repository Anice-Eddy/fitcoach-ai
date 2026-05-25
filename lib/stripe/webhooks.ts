// Logique de traitement des webhooks Stripe
// Appelée depuis /api/stripe/webhook/route.ts

import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma/client'
import { getPlanByPriceId } from './plans'
import type { SubscriptionPlan, SubscriptionStatus } from '@prisma/client'

// Mappe les statuts Stripe → enum Prisma
function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  const map: Record<string, SubscriptionStatus> = {
    active:             'ACTIVE',
    canceled:           'CANCELED',
    incomplete:         'INACTIVE',
    incomplete_expired: 'INACTIVE',
    past_due:           'PAST_DUE',
    trialing:           'TRIALING',
    unpaid:             'PAST_DUE',
    paused:             'INACTIVE',
  }
  return map[status] ?? 'INACTIVE'
}

export async function handleSubscriptionUpsert(sub: Stripe.Subscription): Promise<void> {
  const customerId = sub.customer as string
  const priceId    = sub.items.data[0]?.price.id

  const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } })
  if (!user) return

  const plan    = getPlanByPriceId(priceId ?? '')
  const planKey = (plan?.plan ?? 'FREE') as SubscriptionPlan
  const status  = mapStatus(sub.status)
  const periodEnd = new Date((sub.current_period_end ?? 0) * 1000)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data:  { subscriptionPlan: planKey, subscriptionStatus: status },
    }),
    prisma.subscription.upsert({
      where:  { userId: user.id },
      create: {
        userId:                user.id,
        plan:                  planKey,
        status,
        stripeSubscriptionId:  sub.id,
        stripePriceId:         priceId,
        stripeCurrentPeriodEnd: periodEnd,
        cancelAtPeriodEnd:     sub.cancel_at_period_end,
      },
      update: {
        plan,
        status,
        stripeSubscriptionId:  sub.id,
        stripePriceId:         priceId,
        stripeCurrentPeriodEnd: periodEnd,
        cancelAtPeriodEnd:     sub.cancel_at_period_end,
      },
    }),
  ])
}

export async function handleSubscriptionDeleted(sub: Stripe.Subscription): Promise<void> {
  const customerId = sub.customer as string
  const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } })
  if (!user) return

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data:  { subscriptionPlan: 'FREE', subscriptionStatus: 'INACTIVE' },
    }),
    prisma.subscription.update({
      where: { userId: user.id },
      data:  { plan: 'FREE', status: 'CANCELED' },
    }),
  ])
}

export async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const customerId = session.customer as string
  const userId     = session.metadata?.userId

  if (userId && customerId) {
    await prisma.user.update({
      where: { id: userId },
      data:  { stripeCustomerId: customerId },
    })
  }
}
