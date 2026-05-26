import type { AIAgentType, AIReportType } from '@prisma/client'
import { prisma } from '@/lib/prisma/client'
import { AGENT_LABELS, AGENT_SYSTEM_PROMPTS } from '@/lib/ai/agents'
import { AIProviderService } from '@/lib/ai/provider-service'
import { getMemberAIContext, hasEnoughDataForAnalysis, serializeContext } from '@/lib/ai/context'
import type { MemberAccess } from '@/lib/ai/types'

const providerService = new AIProviderService()

function buildPrompt(task: string, contextJson: string, message?: string) {
  return [
    `Tâche: ${task}`,
    message ? `Message utilisateur: ${message}` : null,
    'Données réelles disponibles:',
    contextJson,
    'Réponds en français. Ne mentionne pas de données qui ne sont pas présentes.',
  ].filter(Boolean).join('\n\n')
}

export class AIService {
  async chat(access: MemberAccess, agentType: AIAgentType, message: string, conversationId?: string | null) {
    const context = await getMemberAIContext(access.memberId, access.coachId)
    if (!context) throw new Error('MEMBER_NOT_FOUND')

    const prompt = buildPrompt(
      `Répondre comme ${AGENT_LABELS[agentType]} dans un chat IA fitness.`,
      serializeContext(context),
      message,
    )

    const conversation = conversationId
      ? await prisma.aIConversation.findFirst({
          where: {
            id: conversationId,
            userId: access.requesterId,
            memberId: access.memberId,
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
      { role: 'system', content: AGENT_SYSTEM_PROMPTS[agentType] },
      { role: 'user', content: prompt },
    ])

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

    return { conversationId: currentConversation.id, provider: result.provider, response: result.text }
  }

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

    const prompt = buildPrompt(task, serializeContext(context))
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
