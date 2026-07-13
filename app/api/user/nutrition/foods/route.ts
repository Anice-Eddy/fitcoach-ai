export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'

const categorySchema = z.enum(['protein', 'carb', 'fat', 'vegetable', 'fruit', 'dairy'])
const visibilitySchema = z.enum(['PUBLIC', 'PRIVATE'])

const foodSchema = z.object({
  name:            z.string().trim().min(2).max(120).optional(),
  nameFr:          z.string().trim().min(2).max(120).optional().nullable(),
  nameEn:          z.string().trim().min(2).max(120).optional().nullable(),
  brand:           z.string().trim().max(80).optional().nullable(),
  category:        categorySchema,
  visibility:      visibilitySchema.default('PUBLIC'),
  caloriesPer100g: z.number().min(0).max(1000),
  proteinPer100g:  z.number().min(0).max(100),
  carbsPer100g:    z.number().min(0).max(150),
  fatPer100g:      z.number().min(0).max(120),
  fiberPer100g:    z.number().min(0).max(100).optional().nullable(),
  sugarPer100g:    z.number().min(0).max(150).optional().nullable(),
}).refine((value) => Boolean(value.name || value.nameFr || value.nameEn), {
  message: 'At least one food name is required',
  path:    ['name'],
})

type FoodLibraryRow = {
  id: string; createdByUserId: string | null; name: string; nameFr: string | null; nameEn: string | null
  brand: string | null; category: string; visibility: string; source: string
  caloriesPer100g: number; proteinPer100g: number; carbsPer100g: number; fatPer100g: number
  fiberPer100g: number | null; sugarPer100g: number | null; createdAt: Date; updatedAt: Date
}

type Locale = 'fr' | 'en'

function foodNameForLocale(food: Pick<FoodLibraryRow, 'name' | 'nameFr' | 'nameEn'>, locale: Locale) {
  return locale === 'en'
    ? food.nameEn || food.name || food.nameFr || ''
    : food.nameFr || food.name || food.nameEn || ''
}

function serializeFood(food: FoodLibraryRow, userId: string, locale: Locale) {
  return {
    ...food,
    displayName: foodNameForLocale(food, locale),
    createdAt: food.createdAt.toISOString(),
    updatedAt: food.updatedAt.toISOString(),
    canEdit:   food.createdByUserId === userId,
    canDelete: food.createdByUserId === userId,
  }
}

/** Lists public user-created foods plus the authenticated user's private foods. */
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim()
  const locale: Locale = url.searchParams.get('locale') === 'en' ? 'en' : 'fr'
  const take = Math.min(Number(url.searchParams.get('limit') ?? 80) || 80, 100)

  const foods = await prisma.foodLibraryItem.findMany({
    where: {
      deletedAt: null,
      AND: [
        q ? {
          OR: [
            { name:   { contains: q, mode: 'insensitive' } },
            { nameFr: { contains: q, mode: 'insensitive' } },
            { nameEn: { contains: q, mode: 'insensitive' } },
          ],
        } : {},
        {
          OR: [
            { visibility: 'PUBLIC' },
            { createdByUserId: session.user.id },
          ],
        },
      ],
    },
    orderBy: [{ name: 'asc' }, { createdAt: 'desc' }],
    take,
  })

  return NextResponse.json({ foods: foods.map(food => serializeFood(food, session.user.id, locale)) })
}

/** Creates an authenticated user's food, visible to everyone by default. */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const locale: Locale = url.searchParams.get('locale') === 'en' ? 'en' : 'fr'
  const parsed = foodSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const canonicalName = parsed.data.name || parsed.data.nameFr || parsed.data.nameEn || ''

  const food = await prisma.foodLibraryItem.create({
    data: {
      ...parsed.data,
      name:            canonicalName,
      nameFr:          parsed.data.nameFr || null,
      nameEn:          parsed.data.nameEn || null,
      brand:           parsed.data.brand || null,
      fiberPer100g:    parsed.data.fiberPer100g ?? null,
      sugarPer100g:    parsed.data.sugarPer100g ?? null,
      createdByUserId: session.user.id,
      source:          'USER',
    },
  })

  return NextResponse.json({ food: serializeFood(food, session.user.id, locale) }, { status: 201 })
}
