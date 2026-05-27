import type { AIAgentType, AIReportType } from '@prisma/client'
import { prisma } from '@/lib/prisma/client'
import { AGENT_LABELS, AGENT_SYSTEM_PROMPTS } from '@/lib/ai/agents'
import { AIProviderService } from '@/lib/ai/provider-service'
import { getMemberAIContext, hasEnoughDataForAnalysis, serializeContextCompact } from '@/lib/ai/context'
import {
  buildMemoryInstruction,
  getAIMemory,
  getContextFirstName,
  getRecentConversationMessages,
  updateAIMemory,
} from '@/lib/ai/memory'
import type { AIMessageInput, MemberAccess } from '@/lib/ai/types'

const providerService = new AIProviderService()

// Assembles the coach prompt: task + member message + compact context summary.
function buildPrompt(task: string, contextSummary: string, message?: string) {
  return [
    message ? `MESSAGE: ${message}` : `TÂCHE: ${task}`,
    contextSummary,
  ].filter(Boolean).join('\n\n')
}

/** Orchestrates AI-powered chat and report generation for member and coach workflows. */
export class AIService {
  /** Sends a user message to the specified AI agent, persists the conversation turn, updates memory, and returns the assistant reply. */
  async chat(access: MemberAccess, agentType: AIAgentType, message: string, conversationId?: string | null, preferredProvider?: 'GEMINI' | 'GROQ') {
    const context = await getMemberAIContext(access.memberId, access.coachId)
    if (!context) throw new Error('MEMBER_NOT_FOUND')

    const prompt = buildPrompt(
      `Répondre comme ${AGENT_LABELS[agentType]} dans un chat IA fitness.`,
      serializeContextCompact(context),
      message,
    )

    const conversation = conversationId
      ? await prisma.aIConversation.findFirst({
          where: {
            id: conversationId,
            userId: access.requesterId,
            memberId: access.memberId,
            agentType,
          },
        })
      : null

    const currentConversation = conversation ?? await prisma.aIConversation.create({
      data: {
        userId:    access.requesterId,
        memberId:  access.memberId,
        coachId:   access.coachId,
        agentType,
        title:     message.slice(0, 80),
      },
    })

    const memoryScope = {
      userId:    access.requesterId,
      memberId:  access.memberId,
      coachId:   access.coachId,
      agentType,
    }
    const [memory, recentMessages] = await Promise.all([
      getAIMemory(memoryScope),
      conversation ? getRecentConversationMessages(conversation.id) : Promise.resolve([]),
    ])
    const firstName = getContextFirstName(context)
    const memoryInstruction = buildMemoryInstruction({ memory, firstName, recentMessages })
    const conversationMessages: AIMessageInput[] = recentMessages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role:    m.role as 'user' | 'assistant',
        content: m.content,
      }))

    await prisma.aIMessage.create({
      data: {
        conversationId: currentConversation.id,
        userId:         access.requesterId,
        memberId:       access.memberId,
        coachId:        access.coachId,
        role:           'user',
        content:        message,
        agentType,
      },
    })

    const result = await providerService.generate([
      { role: 'system', content: `${AGENT_SYSTEM_PROMPTS[agentType]}\n\n${memoryInstruction}` },
      ...conversationMessages,
      { role: 'user', content: prompt },
    ], preferredProvider)

    await prisma.aIMessage.create({
      data: {
        conversationId: currentConversation.id,
        userId:         access.requesterId,
        memberId:       access.memberId,
        coachId:        access.coachId,
        role:           'assistant',
        content:        result.text,
        prompt,
        response:       result.text,
        provider:       result.provider,
        agentType,
      },
    })

    await updateAIMemory({
      scope: memoryScope,
      firstName,
      previousMemory: memory,
      userMessage: message,
      assistantResponse: result.text,
    })

    return { conversationId: currentConversation.id, provider: result.provider, response: result.text }
  }

  /** Generates and persists an AI report of the given type; returns insufficientData flag if profile/metrics are missing. */
  async generateReport(access: MemberAccess, type: AIReportType, agentType: AIAgentType, task: string) {
    const context = await getMemberAIContext(access.memberId, access.coachId)
    if (!context) throw new Error('MEMBER_NOT_FOUND')
    const hasEnoughData = type === 'WORKOUT_PLAN' || type === 'NUTRITION_PLAN'
      ? context.dataQuality.hasProfile
      : hasEnoughDataForAnalysis(context)

    if (!hasEnoughData) {
      return {
        insufficientData: true,
        response: 'Données insuffisantes pour générer une analyse IA fiable.',
      }
    }

    const prompt = buildPrompt(task, serializeContextCompact(context))
    const result = await providerService.generate([
      { role: 'system', content: AGENT_SYSTEM_PROMPTS[agentType] },
      { role: 'user', content: prompt },
    ])

    const report = await prisma.aIReport.create({
      data: {
        userId:    access.requesterId,
        memberId:  access.memberId,
        coachId:   access.coachId,
        type,
        agentType,
        prompt,
        response:  result.text,
        provider:  result.provider,
        metadata:  { dataQuality: context.dataQuality },
      },
    })

    return {
      id: report.id,
      provider: result.provider,
      response: result.text,
      insufficientData: false,
    }
  }
}
