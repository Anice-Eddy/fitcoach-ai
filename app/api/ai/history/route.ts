export const dynamic = 'force-dynamic'

// DELETE /api/ai/history — supprime tout l'historique IA de l'utilisateur connecté
// (conversations, messages, mémoire, rapports, usage quotidien)

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { RATE_LIMITS, rateLimitByUserId } from '@/lib/security/rate-limit'

export async function DELETE(_req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const limited = await rateLimitByUserId(session.user.id, 'ai:history-delete', RATE_LIMITS.ai)
  if (!limited.ok) return limited.response

  const userId = session.user.id

  // Delete in dependency order (messages depend on conversations)
  await prisma.$transaction([
    prisma.aIMessage.deleteMany({ where: { userId } }),
    prisma.aIConversation.deleteMany({ where: { userId } }),
    prisma.aIMemory.deleteMany({ where: { userId } }),
    prisma.aIReport.deleteMany({ where: { userId } }),
    prisma.aIUsageDaily.deleteMany({ where: { userId } }),
  ])

  return NextResponse.json({ deleted: true })
}
