export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse }           from 'next/server'
import { prisma }                 from '@/lib/prisma/client'
import { verifyAppleHealthToken } from '@/lib/integrations/apple-health-token'

/**
 * Payload envoyé par le Raccourci iOS BodyOps.
 * Chaque champ est optionnel — le Raccourci envoie ce qu'Apple Health lui donne.
 */
interface ShortcutPayload {
  // ── Composition corporelle ─────────────────────────────────────────────────
  weightKg?:        number
  bodyFatPct?:      number
  muscleMassKg?:    number

  // ── Activité quotidienne ───────────────────────────────────────────────────
  steps?:           number
  caloriesActive?:  number // Calories actives (Active Energy)

  // ── Récupération et sommeil ────────────────────────────────────────────────
  sleepHours?:      number

  // ── Données cardiovasculaires (Apple Watch recommandé) ────────────────────
  heartRateAvg?:     number // FC moyenne journalière (bpm)
  restingHeartRate?: number // FC au repos (bpm)
  vo2Max?:           number // VO2 max estimé (ml/kg/min) — Apple Watch
  hrv?:              number // Variabilité FC SDNN (ms) — Apple Watch
  spo2?:             number // Saturation O2 (%) — Apple Watch Series 6+

  // ── Méta ──────────────────────────────────────────────────────────────────
  date?:            string // ISO date string, défaut = aujourd'hui
}

/**
 * GET /api/user/metrics/apple-health?token={userId}:{hmac}
 * Test rapide de validité du token — utile pour vérifier le Raccourci.
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
 * Appelé par le Raccourci iOS BodyOps.
 * Auth : Authorization: Bearer {userId}:{hmac-token}
 * Chaque jour est upserted — si le Raccourci tourne plusieurs fois dans la journée,
 * les valeurs sont mises à jour sans créer de doublon.
 */
export async function POST(req: Request) {
  // ── Authentification via token HMAC ──────────────────────────────────────
  const authHeader = req.headers.get('Authorization') ?? req.headers.get('authorization') ?? ''
  const token      = authHeader.replace(/^[Bb]earer\s+/i, '').trim()
  const userId     = await verifyAppleHealthToken(token)

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

  // ── Parsing du corps ──────────────────────────────────────────────────────
  let body: ShortcutPayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  // ── Résolution de la date (défaut = aujourd'hui) ──────────────────────────
  const date = body.date ? new Date(body.date) : new Date()

  // ── Construction du payload — seuls les champs fournis sont écrits ────────
  const payload = {
    date,
    // Composition corporelle
    ...(body.weightKg     !== undefined && { weightKg:     body.weightKg }),
    ...(body.bodyFatPct   !== undefined && { bodyFatPct:   body.bodyFatPct }),
    ...(body.muscleMassKg !== undefined && { muscleMassKg: body.muscleMassKg }),
    // Activité
    ...(body.steps          !== undefined && { steps:         Math.round(body.steps) }),
    ...(body.caloriesActive !== undefined && { caloriesActive: Math.round(body.caloriesActive) }),
    // Récupération
    ...(body.sleepHours !== undefined && { sleepHours: body.sleepHours }),
    // Cardio (Apple Watch)
    ...(body.heartRateAvg     !== undefined && { heartRateAvg:     Math.round(body.heartRateAvg) }),
    ...(body.restingHeartRate !== undefined && { restingHeartRate: Math.round(body.restingHeartRate) }),
    ...(body.vo2Max           !== undefined && { vo2Max:           body.vo2Max }),
    ...(body.hrv              !== undefined && { hrv:              body.hrv }),
    ...(body.spo2             !== undefined && { spo2:             body.spo2 }),
  }

  // ── Upsert par jour pour éviter les doublons ──────────────────────────────
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
    // Retourne les champs enregistrés pour que le Raccourci puisse confirmer
    saved: Object.keys(payload).filter(k => k !== 'date'),
  })
}
