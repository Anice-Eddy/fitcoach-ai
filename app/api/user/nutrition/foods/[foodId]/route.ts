export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'

const categorySchema = z.enum(['protein', 'carb', 'fat', 'vegetable', 'fruit', 'dairy'])

const foodPatchSchema = z.object({
  name:            z.string().trim().min(2).max(120).optional(),
  brand:           z.string().trim().max(80).optional().nullable(),
  category:        categorySchema.optional(),
  visibility:      z.enum(['PUBLIC', 'PRIVATE']).optional(),
  caloriesPer100g: z.number().min(0).max(1000).optional(),
  proteinPer100g:  z.number().min(0).max(100).optional(),
  carbsPer100g:    z.number().min(0).max(150).optional(),
  fatPer100g:      z.number().min(0).max(120).optional(),
  fiberPer100g:    z.number().min(0).max(100).optional().nullable(),
  sugarPer100g:    z.number().min(0).max(150).optional().nullable(),
})

async function assertOwner(foodId: string, userId: string) {
  const food = await prisma.foodLibraryItem.findFirst({
    where: { id: foodId, deletedAt: null },
  })
  if (!food) return { error: NextResponse.json({ error: 'Aliment introuvable' }, { status: 404 }) }
  if (food.createdByUserId !== userId) {
    return { error: NextResponse.json({ error: 'Action non autorisée sur cet aliment' }, { status: 403 }) }
  }
  return { food }
}

/** Updates a food only when the authenticated user created it. */
export async function PATCH(req: Request, { params }: { params: { foodId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const owner = await assertOwner(params.foodId, session.user.id)
  if (owner.error) return owner.error

  const parsed = foodPatchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const food = await prisma.foodLibraryItem.update({
    where: { id: params.foodId },
    data:  {
      ...parsed.data,
      brand: parsed.data.brand === undefined ? undefined : parsed.data.brand || null,
    },
  })

  return NextResponse.json({ food })
}

/** Soft-deletes a food only for its creator; existing nutrition logs keep their copied macros. */
export async function DELETE(_req: Request, { params }: { params: { foodId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const owner = await assertOwner(params.foodId, session.user.id)
  if (owner.error) return owner.error

  await prisma.foodLibraryItem.update({
    where: { id: params.foodId },
    data:  { deletedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
