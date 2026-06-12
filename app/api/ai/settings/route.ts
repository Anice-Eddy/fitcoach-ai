export const dynamic = 'force-dynamic'

// GET /api/ai/settings — retourne les préférences IA de l'utilisateur connecté
// PATCH /api/ai/settings — met à jour aiMemoryEnabled / aiHistoryEnabled

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { RATE_LIMITS, rateLimitByUserId } from '@/lib/security/rate-limit'

const patchSchema = z.object({
  aiMemoryEnabled:  z.boolean().optional(),
  aiHistoryEnabled: z.boolean().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const profile = await prisma.profile.findUnique({
    where:  { userId: session.user.id },
    select: { aiMemoryEnabled: true, aiHistoryEnabled: true },
  })

  if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
  return NextResponse.json(profile)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const limited = await rateLimitByUserId(session.user.id, 'ai:settings', RATE_LIMITS.ai)
  if (!limited.ok) return limited.response

  const parsed = patchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 422 })

  const profile = await prisma.profile.update({
    where:  { userId: session.user.id },
    data:   parsed.data,
    select: { aiMemoryEnabled: true, aiHistoryEnabled: true },
  })

  return NextResponse.json(profile)
}
