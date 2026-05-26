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
  const product = await prisma.affiliateProduct.findUnique({ where: { id: productId } })
  if (!product) return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })

  // Hash de l'IP pour conformité RGPD (pas de stockage en clair)
  const ip      = req.headers.get('x-forwarded-for') ?? 'unknown'
  const ipHash  = createHash('sha256').update(ip + (process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? '')).digest('hex')
  const ua      = req.headers.get('user-agent') ?? undefined

  await prisma.affiliateClick.create({
    data: {
      productId,
      category:  product.category,
      userId:    session?.user?.id ?? undefined,
      source:    source ?? undefined,
      ipHash,
      userAgent: ua,
    },
  })

  return NextResponse.json({ tracked: true })
}
