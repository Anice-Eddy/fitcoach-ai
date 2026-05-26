import type { AIAgentType, AIProvider, AIReportType } from '@prisma/client'

export type AgentType = AIAgentType
export type ProviderName = AIProvider
export type ReportType = AIReportType

export type AIMessageInput = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type AIProviderResult = {
  provider: ProviderName
  text: string
}

export type MemberAIContext = {
  member: {
    id: string
    name: string | null
  }
  profile: unknown
  bodyMetrics: unknown[]
  workoutPrograms: unknown[]
  workoutSessions: unknown[]
  nutritionPlans: unknown[]
  coachNotes: unknown[]
  appointments: unknown[]
  userNotes: unknown[]
  dataQuality: {
    hasProfile: boolean
    metricsCount: number
    completedSessionsCount: number
    nutritionPlansCount: number
    coachNotesCount: number
  }
}

export type MemberAccess = {
  requesterId: string
  memberId: string
  coachId: string | null
  role: 'member' | 'coach'
}
