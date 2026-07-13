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

// Returns the trimmed string value, or empty string if the value is not a string.
function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

// Deduplicates, trims, and limits the array to MAX_MEMORY_ITEMS non-empty strings.
function unique(values: string[]) {
  return Array.from(new Set(values.map(v => v.trim()).filter(Boolean))).slice(0, MAX_MEMORY_ITEMS)
}

// Collapses whitespace and truncates the string to max characters with a trailing ellipsis.
function compact(value: string, max = MAX_SUMMARY_LENGTH) {
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized.length > max ? `${normalized.slice(0, max - 3)}...` : normalized
}

/** Extracts the user's first name from the profile or from the first token of their display name. */
export function getContextFirstName(context: MemberAIContext) {
  const profile = context.profile && typeof context.profile === 'object'
    ? context.profile as Record<string, unknown>
    : null

  return text(profile?.firstName) || text(context.member.name?.split(' ')[0])
}

/** Parses a user message for fitness topics and stated preferences; returns deduplicated topics and preference strings. */
export function extractMemorySignals(userMessage: string) {
  const lower = userMessage.toLowerCase()
  const topics: string[] = []
  const preferences: string[] = []

  const topicMatchers: Array<[string, string[]]> = [
    ['training', ['entrainement', 'entraînement', 'training', 'session', 'séance', 'seance', 'programme', 'program', 'exercice', 'exercise', 'muscu']],
    ['nutrition', ['nutrition', 'calorie', 'macro', 'protéine', 'proteine', 'repas', 'diète', 'diete']],
    ['progression', ['progression', 'stagnation', 'poids', 'performance', 'charge', 'évolution', 'evolution']],
    ['recovery', ['récupération', 'recuperation', 'recovery', 'sommeil', 'sleep', 'fatigue', 'repos', 'rest']],
    ['motivation', ['motivation', 'discipline', 'objectif', 'habitude', 'mental']],
    ['pain/injury', ['douleur', 'pain', 'blessure', 'injury', 'gêne', 'gene', 'mal au', 'tendinite', 'tendonitis']],
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

/** Builds the system-level memory instruction block injected before each AI call, combining rules, first name, and conversation history summary. */
export function buildMemoryInstruction(params: {
  memory: AIMemory | null
  firstName: string
  recentMessages: RecentMessage[]
}) {
  const hasHistory = !!params.memory?.summary || params.recentMessages.length > 0
  const lines = [
    'Conversation rules:',
    '- Reply like an ongoing conversation, not like a first meeting.',
    '- Do not say "Hello", "nice to meet you", or any automatic intro unless the user clearly greeted first.',
    '- Do not repeat the first name unless it makes the sentence more natural; maximum once per reply.',
    '- Reply directly when the context is already known.',
    '- Style: natural, short, immediately useful. Avoid long generic replies.',
    '- Give 1 to 4 concrete actions unless the user asks for a detailed plan.',
    params.firstName ? `Remembered first name: ${params.firstName}.` : null,
    params.memory?.summary ? `Memory summary: ${params.memory.summary}` : null,
    params.memory?.preferences.length ? `Remembered preferences: ${params.memory.preferences.join('; ')}` : null,
    params.memory?.topics.length ? `Recent recurring topics: ${params.memory.topics.join(', ')}` : null,
    hasHistory ? null : 'First known interaction: you may be welcoming, but stay brief.',
  ]

  return lines.filter(Boolean).join('\n')
}

/** Retrieves the most-recently-updated AIMemory record for the given scope, or null if none exists. */
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

/** Fetches the most recent messages of a conversation in chronological order; capped at MAX_RECENT_MESSAGES. */
export async function getRecentConversationMessages(conversationId: string) {
  const messages = await prisma.aIMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: MAX_RECENT_MESSAGES,
    select: { role: true, content: true, createdAt: true },
  })

  return messages.reverse()
}

/** Upserts the AIMemory record for the scope, merging signals from the latest exchange with the previous memory summary. Skips if the user has disabled AI memory. */
export async function updateAIMemory(params: {
  scope: MemoryScope
  firstName: string
  previousMemory: AIMemory | null
  userMessage: string
  assistantResponse: string
}) {
  // Respect the user's AI memory preference
  const profile = await prisma.profile.findUnique({
    where:  { userId: params.scope.userId },
    select: { aiMemoryEnabled: true },
  })
  if (profile && !profile.aiMemoryEnabled) return
  const signals = extractMemorySignals(params.userMessage)
  const preferences = unique([...(params.previousMemory?.preferences ?? []), ...signals.preferences])
  const topics = unique([...signals.topics, ...(params.previousMemory?.topics ?? [])])
  const lastExchange = compact(
    `Last exchange: user="${params.userMessage}" assistant="${params.assistantResponse}"`,
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
