import { describe, expect, it, vi } from 'vitest'
import { generateAIEnhancedProgram, parseAIWorkoutProgram } from '@/lib/training/ai-program'

const profile = {
  firstName: 'Alex',
  age: 28,
  gender: 'MALE',
  weightKg: 78,
  heightCm: 178,
  activityLevel: 'MODERATELY_ACTIVE',
  fitnessGoal: 'MUSCLE_GAIN',
  fitnessLevel: 'INTERMEDIATE',
  bodyFocus: 'FULL_BODY',
  targetWeightKg: 82,
  trainingDaysPerWeek: 4,
  availableEquipment: ['BARBELL', 'DUMBBELL', 'BENCH'],
  injuries: null,
}

describe('parseAIWorkoutProgram', () => {
  it('extrait un JSON même quand il est entouré de markdown', () => {
    const parsed = parseAIWorkoutProgram('```json\n{"name":"Plan IA","sessions":[]}\n```')
    expect(parsed?.name).toBe('Plan IA')
  })
})

describe('generateAIEnhancedProgram', () => {
  it('retombe sur le générateur local si aucun provider IA n’est configuré', async () => {
    vi.stubEnv('GEMINI_API_KEY', '')
    vi.stubEnv('GROQ_API_KEY', '')

    const result = await generateAIEnhancedProgram(profile)

    expect(result.aiGenerated).toBe(false)
    expect(result.provider).toBe('LOCAL')
    expect(result.program.sessions.length).toBeGreaterThan(0)

    vi.unstubAllEnvs()
  })
})
