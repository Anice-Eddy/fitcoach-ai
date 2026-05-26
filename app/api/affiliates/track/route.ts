export const dynamic = 'force-dynamic'

// POST /api/affiliates/track — enregistre un clic affilié (RGPD : IP hashée)

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { affiliateClickSchema } from '@/utils/validators'
import { createHash } from 'crypto'

export async function POST(req: Request) {
  const session = await auth()

  const body   = await req.json()
  const parsed = affiliateClickSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 422 })

  const { productId, source } = parsed.data

  // Look up category from DB if product was seeded; fall back to static data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let category: any
  const dbProduct = await prisma.affiliateProduct.findUnique({ where: { id: productId } })
  if (dbProduct) {
    category = dbProduct.category
  } else {
    const { AFFILIATE_PRODUCTS } = await import('@/lib/affiliates/products')
    category = AFFILIATE_PRODUCTS.find((p) => p.id === productId)?.category
    if (!category) return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })
  }

  // Hash de l'IP pour conformité RGPD (pas de stockage en clair)
  const ip      = req.headers.get('x-forwarded-for') ?? 'unknown'
  const ipHash  = createHash('sha256').update(ip + (process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? '')).digest('hex')
  const ua      = req.headers.get('user-agent') ?? undefined

  await prisma.affiliateClick.create({
    data: {
      productId,
      category,
      userId:    session?.user?.id ?? undefined,
      source:    source ?? undefined,
      ipHash,
      userAgent: ua,
    },
  })

  return NextResponse.json({ tracked: true })
}
