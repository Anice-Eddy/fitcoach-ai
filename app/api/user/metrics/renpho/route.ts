export const dynamic = 'force-dynamic'

import { NextResponse }      from 'next/server'
import { auth }              from '@/lib/auth/auth'
import { prisma }            from '@/lib/prisma/client'
import { parseRenphoCSV }   from '@/lib/integrations/renpho'

/** Accepts a Renpho CSV text body, parses it, and bulk-upserts body metrics (deduped by userId+date). */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const text = await req.text()
  if (!text) return NextResponse.json({ error: 'Corps de la requête vide' }, { status: 400 })

  let rows
  try {
    rows = parseRenphoCSV(text)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Fichier invalide' }, { status: 422 })
  }

  // Upsert by userId + date (truncated to day) to avoid duplicates on re-import.
  let imported = 0
  for (const row of rows) {
    const dayStart = new Date(row.date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setHours(23, 59, 59, 999)

    const existing = await prisma.bodyMetric.findFirst({
      where: { userId: session.user.id, date: { gte: dayStart, lte: dayEnd } },
    })

    const payload = {
      date:                     row.date,
      weightKg:                 row.weightKg,
      bodyFatPct:               row.bodyFatPct,
      muscleMassKg:             row.muscleMassKg,
      renphoBmi:                row.renphoBmi,
      renphoFatFreeMassKg:      row.renphoFatFreeMassKg,
      renphoSubcutaneousFatPct: row.renphoSubcutaneousFatPct,
      renphoVisceralFat:        row.renphoVisceralFat,
      renphoBodyWaterPct:       row.renphoBodyWaterPct,
      renphoSkeletalMusclePct:  row.renphoSkeletalMusclePct,
      renphoBoneMassKg:         row.renphoBoneMassKg,
      renphoProteinPct:         row.renphoProteinPct,
      renphoBmr:                row.renphoBmr,
      renphoMetabolicAge:       row.renphoMetabolicAge != null ? Math.round(row.renphoMetabolicAge) : undefined,
    }

    if (existing) {
      await prisma.bodyMetric.update({ where: { id: existing.id }, data: payload })
    } else {
      await prisma.bodyMetric.create({ data: { userId: session.user.id, ...payload } })
    }
    imported++
  }

  return NextResponse.json({ imported, total: rows.length })
}
