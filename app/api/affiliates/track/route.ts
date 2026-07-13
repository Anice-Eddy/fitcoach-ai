export const dynamic = 'force-dynamic'

// POST /api/affiliates/track - records an affiliate click with a hashed IP.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { affiliateClickSchema } from '@/utils/validators'
import { createHash } from 'crypto'

/** Records a single affiliate click for productId, hashing the IP for GDPR compliance; returns { tracked: true }. */
export async function POST(req: Request) {
  const session = await auth()

  const body   = await req.json()
  const parsed = affiliateClickSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 422 })

  const { productId, source } = parsed.data

  // Ensure the product row exists in DB (upsert from static catalog if needed)
  const { AFFILIATE_PRODUCTS } = await import('@/lib/affiliates/products')
  const staticProduct = AFFILIATE_PRODUCTS.find((p) => p.id === productId)
  if (!staticProduct) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  await prisma.affiliateProduct.upsert({
    where:  { id: productId },
    update: {},
    create: {
      id:               productId,
      name:             staticProduct.name,
      brand:            staticProduct.brand          ?? null,
      description:      staticProduct.description    ?? null,
      category:         staticProduct.category,
      affiliateUrl:     staticProduct.affiliateUrl,
      imageUrl:         staticProduct.imageUrl        ?? null,
      price:            staticProduct.price           ?? null,
      commissionRateMin: staticProduct.commissionRateMin,
      commissionRateMax: staticProduct.commissionRateMax,
      fitnessGoals:     staticProduct.fitnessGoals   ?? [],
      tags:             staticProduct.tags            ?? [],
    },
  })

  const ip     = req.headers.get('x-forwarded-for') ?? 'unknown'
  const ipHash = createHash('sha256').update(ip + (process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? '')).digest('hex')
  const ua     = req.headers.get('user-agent') ?? undefined

  await prisma.affiliateClick.create({
    data: {
      productId,
      category:  staticProduct.category,
      userId:    session?.user?.id ?? undefined,
      source:    source ?? undefined,
      ipHash,
      userAgent: ua,
    },
  })

  return NextResponse.json({ tracked: true })
}
