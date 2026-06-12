import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/auth'
import { resolveMemberAccess } from '@/lib/ai/context'

export const agentSchema = z.enum(['TRAINING', 'NUTRITION', 'PROGRESSION', 'MOTIVATION', 'COACH_REPORT'])

/** Authenticates the session and resolves member access. */
export async function getAIAccess(memberId?: string | null) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
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
