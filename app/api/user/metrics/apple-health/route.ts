export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse }              from 'next/server'
import { prisma }                    from '@/lib/prisma/client'
import { verifyAppleHealthToken }    from '@/lib/integrations/apple-health-token'

// Payload envoyé par le Raccourci iOS BodyOps
interface ShortcutPayload {
  weightKg?:      number
  bodyFatPct?:    number
  muscleMassKg?:  number
  steps?:         number
  sleepHours?:    number
  heartRateAvg?:  number  // stocké dans notes
  caloriesActive?: number // stocké dans notes
  date?:          string  // ISO date string, défaut = aujourd'hui
}

/** Quick token test: GET /api/user/metrics/apple-health?token={userId}:{hmac} */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token  = searchParams.get('token') ?? ''
  const userId = await verifyAppleHealthToken(token)
  return NextResponse.json({ valid: !!userId, userId: userId ?? null })
}

/**
 * Called by the BodyOps iOS Shortcut.
 * Auth: Authorization: Bearer {userId}:{hmac-token}
 * Body: JSON payload from HealthKit.
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization') ?? req.headers.get('authorization') ?? ''
  const token  = authHeader.replace(/^[Bb]earer\s+/i, '').trim()
  const userId = await verifyAppleHealthToken(token)

  if (!userId) {
    return NextResponse.json({
      error: 'Token invalide ou expiré',
      debug: {
        headerReceived:  authHeader.substring(0, 40),
        tokenLength:     token.length,
        colonIdx:        token.lastIndexOf(':'),
        secretAvailable: !!process.env.AUTH_SECRET,
      },
    }, { status: 401 })
  }

  let body: ShortcutPayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const date = body.date ? new Date(body.date) : new Date()

  // Build notes from extra fields not in the schema
  const extras: string[] = []
  if (body.heartRateAvg)   extras.push(`FC moy. : ${body.heartRateAvg} bpm`)
  if (body.caloriesActive) extras.push(`Calories actives : ${body.caloriesActive} kcal`)
  const notes = extras.length ? `Apple Health — ${extras.join(' | ')}` : undefined

  // Upsert by day to avoid duplicates if the Shortcut runs multiple times
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0)
  const dayEnd   = new Date(date); dayEnd.setHours(23, 59, 59, 999)

  const existing = await prisma.bodyMetric.findFirst({
    where: { userId, date: { gte: dayStart, lte: dayEnd } },
  })

  const payload = {
    date,
    ...(body.weightKg     !== undefined && { weightKg:     body.weightKg }),
    ...(body.bodyFatPct   !== undefined && { bodyFatPct:   body.bodyFatPct }),
    ...(body.muscleMassKg !== undefined && { muscleMassKg: body.muscleMassKg }),
    ...(body.steps        !== undefined && { steps:        Math.round(body.steps) }),
    ...(body.sleepHours   !== undefined && { sleepHours:   body.sleepHours }),
    ...(notes && { notes }),
  }

  if (existing) {
    await prisma.bodyMetric.update({ where: { id: existing.id }, data: payload })
  } else {
    await prisma.bodyMetric.create({ data: { userId, ...payload } })
  }

  return NextResponse.json({ ok: true, date: date.toISOString().split('T')[0] })
}
