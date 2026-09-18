export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse }           from 'next/server'
import { z }                      from 'zod'
import { prisma }                 from '@/lib/prisma/client'
import { verifyAppleHealthToken } from '@/lib/integrations/apple-health-token'
import { rateLimitResponse }      from '@/lib/security/rate-limit'

const shortcutPayloadSchema = z.object({
  weightKg:        z.number().positive().max(1000).optional(),
  bodyFatPct:      z.number().min(0).max(100).optional(),
  muscleMassKg:    z.number().min(0).max(1000).optional(),
  steps:           z.number().min(0).max(1_000_000).optional(),
  caloriesActive:  z.number().min(0).max(100_000).optional(),
  sleepHours:      z.number().min(0).max(24).optional(),
  heartRateAvg:    z.number().min(0).max(400).optional(),
  restingHeartRate:z.number().min(0).max(400).optional(),
  vo2Max:          z.number().min(0).max(150).optional(),
  hrv:             z.number().min(0).max(10_000).optional(),
  spo2:            z.number().min(0).max(100).optional(),
  date:            z.string().datetime().optional(),
}).strict()

type ShortcutPayload = z.infer<typeof shortcutPayloadSchema>

function noStoreJson(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

/** Validates an Apple Health Shortcut token without disclosing the linked user id. */
export async function GET(req: Request) {
  const limited = await rateLimitResponse(req, {
    scope: 'apple-health.token-check.ip',
    limit: 20,
    windowMs: 15 * 60 * 1000,
  })
  if (limited) return limited

  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token') ?? ''
  const userId = await verifyAppleHealthToken(token)
  return noStoreJson({ valid: Boolean(userId) })
}

/** Accepts a signed Apple Health Shortcut payload and upserts that user's daily metrics. */
export async function POST(req: Request) {
  const limited = await rateLimitResponse(req, {
    scope: 'apple-health.sync.ip',
    limit: 120,
    windowMs: 60 * 60 * 1000,
  })
  if (limited) return limited

  const authHeader = req.headers.get('Authorization') ?? req.headers.get('authorization') ?? ''
  const token = authHeader.replace(/^[Bb]earer\s+/i, '').trim()
  const userId = await verifyAppleHealthToken(token)

  if (!userId) {
    // Never echo credentials, token structure, user ids, or server secret state.
    return noStoreJson({ error: 'Invalid or expired token' }, { status: 401 })
  }

  const parsed = shortcutPayloadSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return noStoreJson({ error: 'Invalid health payload' }, { status: 422 })
  }
  const body: ShortcutPayload = parsed.data

  const date = body.date ? new Date(body.date) : new Date()
  if (Number.isNaN(date.getTime())) {
    return noStoreJson({ error: 'Invalid date' }, { status: 422 })
  }

  const payload = {
    date,
    ...(body.weightKg !== undefined && { weightKg: body.weightKg }),
    ...(body.bodyFatPct !== undefined && { bodyFatPct: body.bodyFatPct }),
    ...(body.muscleMassKg !== undefined && { muscleMassKg: body.muscleMassKg }),
    ...(body.steps !== undefined && { steps: Math.round(body.steps) }),
    ...(body.caloriesActive !== undefined && { caloriesActive: Math.round(body.caloriesActive) }),
    ...(body.sleepHours !== undefined && { sleepHours: body.sleepHours }),
    ...(body.heartRateAvg !== undefined && { heartRateAvg: Math.round(body.heartRateAvg) }),
    ...(body.restingHeartRate !== undefined && { restingHeartRate: Math.round(body.restingHeartRate) }),
    ...(body.vo2Max !== undefined && { vo2Max: body.vo2Max }),
    ...(body.hrv !== undefined && { hrv: body.hrv }),
    ...(body.spo2 !== undefined && { spo2: body.spo2 }),
  }

  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999)

  const existing = await prisma.bodyMetric.findFirst({
    where: { userId, date: { gte: dayStart, lte: dayEnd } },
  })

  if (existing) {
    await prisma.bodyMetric.update({ where: { id: existing.id }, data: payload })
  } else {
    await prisma.bodyMetric.create({ data: { userId, ...payload } })
  }

  return noStoreJson({
    ok: true,
    date: date.toISOString().split('T')[0],
    saved: Object.keys(payload).filter((key) => key !== 'date'),
  })
}
