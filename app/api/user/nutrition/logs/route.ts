export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import type { Prisma } from '@prisma/client'

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const logSchema = z.object({
  date:      dateSchema.optional(),
  clientKey: z.string().min(1).max(160),
  source:    z.string().min(1).max(40).default('PLANNED'),
  mealType:  z.enum(['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'PRE_WORKOUT', 'DINNER', 'POST_WORKOUT']).optional().nullable(),
  name:      z.string().min(1).max(160),
  calories:  z.number().min(0).max(10000),
  proteinG:  z.number().min(0).max(1000),
  carbsG:    z.number().min(0).max(1000),
  fatG:      z.number().min(0).max(1000),
  items:     z.unknown().optional(),
})

const deleteSchema = z.object({
  date:      dateSchema.optional(),
  clientKey: z.string().min(1).max(160),
})

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function totals(logs: Array<{ calories: number; proteinG: number; carbsG: number; fatG: number }>) {
  return logs.reduce(
    (acc, log) => ({
      calories: Math.round(acc.calories + log.calories),
      proteinG: Math.round((acc.proteinG + log.proteinG) * 10) / 10,
      carbsG:   Math.round((acc.carbsG + log.carbsG) * 10) / 10,
      fatG:     Math.round((acc.fatG + log.fatG) * 10) / 10,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  )
}

/** Returns the authenticated user's nutrition logs for a YYYY-MM-DD day plus daily macro totals. */
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const url = new URL(req.url)
  const date = dateSchema.safeParse(url.searchParams.get('date') ?? localDateKey())
  if (!date.success) return NextResponse.json({ error: date.error.flatten() }, { status: 422 })

  const logs = await prisma.nutritionLog.findMany({
    where:   { userId: session.user.id, date: date.data },
    orderBy: { loggedAt: 'asc' },
  })

  return NextResponse.json({ date: date.data, logs, totals: totals(logs) })
}

/** Upserts one consumed meal for the day, so repeated taps cannot create duplicates. */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const parsed = logSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const date = parsed.data.date ?? localDateKey()
  const items = parsed.data.items === undefined || parsed.data.items === null
    ? undefined
    : parsed.data.items as Prisma.InputJsonValue

  const log = await prisma.nutritionLog.upsert({
    where: {
      userId_date_clientKey: {
        userId:    session.user.id,
        date,
        clientKey: parsed.data.clientKey,
      },
    },
    create: {
      userId:    session.user.id,
      date,
      clientKey: parsed.data.clientKey,
      source:    parsed.data.source,
      mealType:  parsed.data.mealType ?? null,
      name:      parsed.data.name,
      calories:  parsed.data.calories,
      proteinG:  parsed.data.proteinG,
      carbsG:    parsed.data.carbsG,
      fatG:      parsed.data.fatG,
      items,
    },
    update: {
      source:   parsed.data.source,
      mealType: parsed.data.mealType ?? null,
      name:     parsed.data.name,
      calories: parsed.data.calories,
      proteinG: parsed.data.proteinG,
      carbsG:   parsed.data.carbsG,
      fatG:     parsed.data.fatG,
      items,
      loggedAt: new Date(),
    },
  })

  return NextResponse.json(log, { status: 201 })
}

/** Removes one logged meal for the day when the user unticks it. */
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const parsed = deleteSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  await prisma.nutritionLog.deleteMany({
    where: {
      userId:    session.user.id,
      date:      parsed.data.date ?? localDateKey(),
      clientKey: parsed.data.clientKey,
    },
  })

  return NextResponse.json({ ok: true })
}
