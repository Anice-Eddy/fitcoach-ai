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
  userFacts: {
    currentWeightKg: number | null
    heightCm: number | null
    age: number | null
    gender: string | null
    primaryGoal: string | null
    targetWeightKg: number | null
    fitnessLevel: string | null
    trainingDaysPerWeek: number | null
    availableEquipment: string[]
    dietaryRestrictions: string[]
    foodPreferences: string[]
    currentProgram: string | null
    progressHistory: string[]
    injuryOrRestrictionSignals: string[]
  }
  missingData: {
    workoutPlan: string[]
    nutritionPlan: string[]
    actionPlan: string[]
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
