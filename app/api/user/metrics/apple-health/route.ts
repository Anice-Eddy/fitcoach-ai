export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse }           from 'next/server'
import { prisma }                 from '@/lib/prisma/client'
import { verifyAppleHealthToken } from '@/lib/integrations/apple-health-token'

/**
 * Payload sent by the BodyOps iOS Shortcut.
 * Every field is optional; the Shortcut sends whatever Apple Health provides.
 */
interface ShortcutPayload {
  // Body composition
  weightKg?:        number
  bodyFatPct?:      number
  muscleMassKg?:    number

  // Daily activity
  steps?:           number
  caloriesActive?:  number // Active Energy calories

  // Recovery and sleep
  sleepHours?:      number

  // Cardiovascular data (Apple Watch recommended)
  heartRateAvg?:     number // Daily average heart rate (bpm)
  restingHeartRate?: number // Resting heart rate (bpm)
  vo2Max?:           number // Estimated VO2 max (ml/kg/min) - Apple Watch
  hrv?:              number // HRV SDNN (ms) - Apple Watch
  spo2?:             number // O2 saturation (%) - Apple Watch Series 6+

  // Meta
  date?:            string // ISO date string, defaults to today
}

/**
 * GET /api/user/metrics/apple-health?token={userId}:{hmac}
 * Quick token validity check, useful for testing the Shortcut.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token  = searchParams.get('token') ?? ''
  const userId = await verifyAppleHealthToken(token)
  if (userId) {
  }
  return NextResponse.json({ valid: !!userId, userId: userId ?? null })
}

/**
 * POST /api/user/metrics/apple-health
 * Called by the BodyOps iOS Shortcut.
 * Auth : Authorization: Bearer {userId}:{hmac-token}
 * Each day is upserted; if the Shortcut runs multiple times in a day,
 * values are updated without creating duplicates.
 */
export async function POST(req: Request) {
  // HMAC token authentication
  const authHeader = req.headers.get('Authorization') ?? req.headers.get('authorization') ?? ''
  const token      = authHeader.replace(/^[Bb]earer\s+/i, '').trim()
  const userId     = await verifyAppleHealthToken(token)

  if (!userId) {
    return NextResponse.json({
      error: 'Invalid or expired token',
      debug: {
        headerReceived:  authHeader.substring(0, 40),
        tokenLength:     token.length,
        colonIdx:        token.lastIndexOf(':'),
        secretAvailable: !!process.env.AUTH_SECRET,
      },
    }, { status: 401 })
  }

  // Body parsing
  let body: ShortcutPayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Date resolution (defaults to today)
  const date = body.date ? new Date(body.date) : new Date()

  // Payload construction: only provided fields are written
  const payload = {
    date,
    // Body composition
    ...(body.weightKg     !== undefined && { weightKg:     body.weightKg }),
    ...(body.bodyFatPct   !== undefined && { bodyFatPct:   body.bodyFatPct }),
    ...(body.muscleMassKg !== undefined && { muscleMassKg: body.muscleMassKg }),
    // Activity
    ...(body.steps          !== undefined && { steps:         Math.round(body.steps) }),
    ...(body.caloriesActive !== undefined && { caloriesActive: Math.round(body.caloriesActive) }),
    // Recovery
    ...(body.sleepHours !== undefined && { sleepHours: body.sleepHours }),
    // Cardio (Apple Watch)
    ...(body.heartRateAvg     !== undefined && { heartRateAvg:     Math.round(body.heartRateAvg) }),
    ...(body.restingHeartRate !== undefined && { restingHeartRate: Math.round(body.restingHeartRate) }),
    ...(body.vo2Max           !== undefined && { vo2Max:           body.vo2Max }),
    ...(body.hrv              !== undefined && { hrv:              body.hrv }),
    ...(body.spo2             !== undefined && { spo2:             body.spo2 }),
  }

  // Upsert by day to avoid duplicates
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0)
  const dayEnd   = new Date(date); dayEnd.setHours(23, 59, 59, 999)

  const existing = await prisma.bodyMetric.findFirst({
    where: { userId, date: { gte: dayStart, lte: dayEnd } },
  })

  if (existing) {
    await prisma.bodyMetric.update({ where: { id: existing.id }, data: payload })
  } else {
    await prisma.bodyMetric.create({ data: { userId, ...payload } })
  }

  return NextResponse.json({
    ok:   true,
    date: date.toISOString().split('T')[0],
    // Return saved fields so the Shortcut can confirm the sync
    saved: Object.keys(payload).filter(k => k !== 'date'),
  })
}
