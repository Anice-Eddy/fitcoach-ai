export const dynamic = 'force-dynamic'

// GET /api/ai/export — exporte toutes les données IA de l'utilisateur (RGPD droit à la portabilité)

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const userId = session.user.id

  const [conversations, memories, reports, usageDaily] = await Promise.all([
    prisma.aIConversation.findMany({
      where:   { userId },
      include: {
        messages: {
          select: { role: true, content: true, agentType: true, provider: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.aIMemory.findMany({
      where:   { userId },
      select:  { agentType: true, summary: true, preferences: true, topics: true, updatedAt: true },
    }),
    prisma.aIReport.findMany({
      where:   { userId },
      select:  { type: true, agentType: true, response: true, provider: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.aIUsageDaily.findMany({
      where:   { userId },
      select:  { date: true, count: true },
      orderBy: { date: 'desc' },
    }),
  ])

  const exportData = {
    exportedAt:    new Date().toISOString(),
    userId,
    conversations: conversations.map(c => ({
      id:        c.id,
      agentType: c.agentType,
      title:     c.title,
      createdAt: c.createdAt.toISOString(),
      messages:  c.messages.map(m => ({
        role:      m.role,
        content:   m.content,
        agentType: m.agentType,
        provider:  m.provider,
        createdAt: m.createdAt.toISOString(),
      })),
    })),
    memories:  memories.map(m => ({
      agentType:   m.agentType,
      summary:     m.summary,
      preferences: m.preferences,
      topics:      m.topics,
      updatedAt:   m.updatedAt.toISOString(),
    })),
    reports:   reports.map(r => ({
      type:      r.type,
      agentType: r.agentType,
      response:  r.response,
      provider:  r.provider,
      createdAt: r.createdAt.toISOString(),
    })),
    usageByDay: usageDaily,
  }

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type':        'application/json',
      'Content-Disposition': `attachment; filename="bodyops-ai-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
