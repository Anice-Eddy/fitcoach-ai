import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/auth'
import { checkDailyRateLimit } from '@/lib/ai/rate-limit'
import { resolveMemberAccess } from '@/lib/ai/context'
import { RATE_LIMITS, mergeHeaders, rateLimitByUserId } from '@/lib/security/rate-limit'

export const agentSchema = z.enum(['TRAINING', 'NUTRITION', 'PROGRESSION', 'MOTIVATION', 'COACH_REPORT'])

function aiQuotaHeaders(quota: { used: number; limit: number; warning: boolean }) {
  const headers = new Headers()
  headers.set('X-AI-Quota-Used', String(quota.used))
  headers.set('X-AI-Quota-Limit', String(quota.limit))
  headers.set('X-AI-Quota-Warning', String(quota.warning))
  return headers
}

/** Authenticates the session, enforces the per-minute AI rate limit + daily quota, and resolves member access. */
export async function getAIAccess(memberId?: string | null) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  }

  const minuteLimit = await rateLimitByUserId(session.user.id, 'ai:minute', RATE_LIMITS.ai)
  if (!minuteLimit.ok) return { error: minuteLimit.response }

  const limited = await checkDailyRateLimit(session.user.id, session.user.plan)
  const headers = aiQuotaHeaders(limited)
  mergeHeaders(headers, minuteLimit.headers)
  if (!limited.ok) {
    const resetDate = new Date(limited.resetAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    return {
      error: NextResponse.json(
        {
          error: `Limite journalière IA atteinte (${limited.limit} appels/jour). Réinitialisation à ${resetDate} UTC.`,
          resetAt: limited.resetAt,
          remaining: 0,
        },
        { status: 429, headers },
      ),
    }
  }

  const access = await resolveMemberAccess(session.user.id, memberId)
  if (!access) {
    return { error: NextResponse.json({ error: 'Accès refusé pour ce membre.' }, { status: 403, headers }) }
  }

  return { access, headers }
}

/** Maps a caught AI error to a structured NextResponse and logs it. */
export function aiError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Erreur IA inconnue'
  console.error('[ai] endpoint error:', message)

  if (message === 'MEMBER_NOT_FOUND') {
    return NextResponse.json({ error: 'Membre introuvable.' }, { status: 404 })
  }

  return NextResponse.json(
    { error: "Le service IA n'est pas disponible pour le moment." },
    { status: 502 },
  )
}
