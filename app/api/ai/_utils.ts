import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/auth'
import { checkDailyRateLimit } from '@/lib/ai/rate-limit'
import { resolveMemberAccess } from '@/lib/ai/context'
import { prisma } from '@/lib/prisma/client'

export const agentSchema = z.enum(['TRAINING', 'NUTRITION', 'PROGRESSION', 'MOTIVATION', 'COACH_REPORT'])

/** Authenticates the session, checks the daily AI quota (20/day member, 50/day coach), and resolves member access. */
export async function getAIAccess(memberId?: string | null) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  }

  // Determine if the requester is a coach (affects daily quota)
  const coachProfile = await prisma.coachProfile.findUnique({
    where:  { userId: session.user.id },
    select: { id: true },
  })
  const isCoach = !!coachProfile

  const limited = await checkDailyRateLimit(session.user.id, isCoach)
  if (!limited.ok) {
    const resetDate = new Date(limited.resetAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    return {
      error: NextResponse.json(
        {
          error: isCoach
            ? `Limite journalière atteinte (50 appels IA/jour pour les coachs). Réinitialisation à ${resetDate} UTC.`
            : `Limite journalière atteinte (20 appels IA/jour). Réinitialisation à ${resetDate} UTC.`,
          resetAt: limited.resetAt,
          remaining: 0,
        },
        { status: 429 },
      ),
    }
  }

  const access = await resolveMemberAccess(session.user.id, memberId)
  if (!access) {
    return { error: NextResponse.json({ error: 'Accès refusé pour ce membre.' }, { status: 403 }) }
  }

  return { access }
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
