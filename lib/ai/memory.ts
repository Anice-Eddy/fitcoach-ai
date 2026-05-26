import type { AIAgentType, AIMemory, AIMessage } from '@prisma/client'
import { prisma } from '@/lib/prisma/client'
import type { MemberAIContext } from '@/lib/ai/types'

type MemoryScope = {
  userId: string
  memberId: string
  coachId: string | null
  agentType: AIAgentType
}

type RecentMessage = Pick<AIMessage, 'role' | 'content' | 'createdAt'>

const MAX_RECENT_MESSAGES = 10
const MAX_MEMORY_ITEMS = 8
const MAX_SUMMARY_LENGTH = 1200

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function unique(values: string[]) {
  return Array.from(new Set(values.map(v => v.trim()).filter(Boolean))).slice(0, MAX_MEMORY_ITEMS)
}

function compact(value: string, max = MAX_SUMMARY_LENGTH) {
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized.length > max ? `${normalized.slice(0, max - 3)}...` : normalized
}

export function getContextFirstName(context: MemberAIContext) {
  const profile = context.profile && typeof context.profile === 'object'
    ? context.profile as Record<string, unknown>
    : null

  return text(profile?.firstName) || text(context.member.name?.split(' ')[0])
}

export function extractMemorySignals(userMessage: string) {
  const lower = userMessage.toLowerCase()
  const topics: string[] = []
  const preferences: string[] = []

  const topicMatchers: Array<[string, string[]]> = [
    ['entraînement', ['entrainement', 'entraînement', 'séance', 'seance', 'programme', 'exercice', 'muscu']],
    ['nutrition', ['nutrition', 'calorie', 'macro', 'protéine', 'proteine', 'repas', 'diète', 'diete']],
    ['progression', ['progression', 'stagnation', 'poids', 'performance', 'charge', 'évolution', 'evolution']],
    ['récupération', ['récupération', 'recuperation', 'sommeil', 'fatigue', 'repos']],
    ['motivation', ['motivation', 'discipline', 'objectif', 'habitude', 'mental']],
    ['douleur/blessure', ['douleur', 'blessure', 'gêne', 'gene', 'mal au', 'tendinite']],
  ]

  for (const [topic, words] of topicMatchers) {
    if (words.some(word => lower.includes(word))) topics.push(topic)
  }

  const preferencePatterns = [
    /\bje préfère\s+([^.!?\n]{3,90})/i,
    /\bje prefere\s+([^.!?\n]{3,90})/i,
    /\bj'aime\s+([^.!?\n]{3,90})/i,
    /\bje n'aime pas\s+([^.!?\n]{3,90})/i,
    /\bje veux\s+([^.!?\n]{3,90})/i,
    /\bmon objectif\s+(?:est|c'est|:)?\s*([^.!?\n]{3,90})/i,
  ]

  for (const pattern of preferencePatterns) {
    const match = userMessage.match(pattern)
    if (match?.[1]) preferences.push(compact(match[1], 120))
  }

  return { topics: unique(topics), preferences: unique(preferences) }
}

export function buildMemoryInstruction(params: {
  memory: AIMemory | null
  firstName: string
  recentMessages: RecentMessage[]
}) {
  const hasHistory = !!params.memory?.summary || params.recentMessages.length > 0
  const lines = [
    'Règles conversationnelles:',
    '- Réponds comme dans une conversation continue, pas comme une première rencontre.',
    '- Ne dis pas "Bonjour", "ravi de te rencontrer", ni une autre intro automatique, sauf si l’utilisateur vient clairement de saluer.',
    '- Ne répète pas le prénom sauf si cela rend la phrase plus naturelle; maximum une fois dans la réponse.',
    '- Réponds directement quand le contexte est déjà connu.',
    '- Style: naturel, court, utile immédiatement. Évite les longues réponses génériques.',
    '- Donne 1 à 4 actions concrètes, sauf si l’utilisateur demande un plan détaillé.',
    params.firstName ? `Prénom mémorisé: ${params.firstName}.` : null,
    params.memory?.summary ? `Résumé mémoire: ${params.memory.summary}` : null,
    params.memory?.preferences.length ? `Préférences mémorisées: ${params.memory.preferences.join('; ')}` : null,
    params.memory?.topics.length ? `Derniers sujets récurrents: ${params.memory.topics.join(', ')}` : null,
    hasHistory ? null : 'Première interaction connue: tu peux être accueillant, mais reste bref.',
  ]

  return lines.filter(Boolean).join('\n')
}

export async function getAIMemory(scope: MemoryScope) {
  return prisma.aIMemory.findFirst({
    where: {
      userId: scope.userId,
      memberId: scope.memberId,
      coachId: scope.coachId,
      agentType: scope.agentType,
    },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function getRecentConversationMessages(conversationId: string) {
  const messages = await prisma.aIMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: MAX_RECENT_MESSAGES,
    select: { role: true, content: true, createdAt: true },
  })

  return messages.reverse()
}

export async function updateAIMemory(params: {
  scope: MemoryScope
  firstName: string
  previousMemory: AIMemory | null
  userMessage: string
  assistantResponse: string
}) {
  const signals = extractMemorySignals(params.userMessage)
  const preferences = unique([...(params.previousMemory?.preferences ?? []), ...signals.preferences])
  const topics = unique([...signals.topics, ...(params.previousMemory?.topics ?? [])])
  const lastExchange = compact(
    `Dernier échange: utilisateur="${params.userMessage}" assistant="${params.assistantResponse}"`,
    420,
  )
  const summary = compact([params.previousMemory?.summary, lastExchange].filter(Boolean).join(' | '))
  const data = {
    firstName: params.firstName || params.previousMemory?.firstName || null,
    summary,
    preferences,
    topics,
  }

  if (params.previousMemory) {
    await prisma.aIMemory.update({ where: { id: params.previousMemory.id }, data })
    return
  }

  await prisma.aIMemory.create({
    data: {
      ...data,
      userId: params.scope.userId,
      memberId: params.scope.memberId,
      coachId: params.scope.coachId,
      agentType: params.scope.agentType,
    },
  })
}
