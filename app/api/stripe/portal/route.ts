// POST /api/stripe/portal — crée une session portail client Stripe
// Permet à l'utilisateur de gérer son abonnement, ses factures et ses moyens de paiement

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { stripe } from '@/lib/stripe/client'
import { prisma } from '@/lib/prisma/client'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { stripeCustomerId: true },
  })

  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: 'Aucun abonnement actif trouvé' }, { status: 404 })
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer:   user.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
  })

  return NextResponse.json({ url: portalSession.url })
}
