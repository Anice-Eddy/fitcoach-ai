import { describe, it, expect } from 'vitest'
import { generateProgram } from '@/lib/training/generate-program'

const baseInput = {
  fitnessGoal:         'MUSCLE_GAIN' as const,
  fitnessLevel:        'INTERMEDIATE' as const,
  trainingDaysPerWeek: 4,
  availableEquipment:  ['BARBELL', 'DUMBBELL', 'BENCH'] as string[],
}

describe('generateProgram', () => {
  it('retourne un programme avec un id', () => {
    const prog = generateProgram(baseInput)
    expect(prog.id).toBeTruthy()
    expect(typeof prog.id).toBe('string')
  })

  it('retourne un nom de programme non vide', () => {
    const prog = generateProgram(baseInput)
    expect(prog.name.length).toBeGreaterThan(0)
  })

  it('retourne le bon objectif fitness', () => {
    const prog = generateProgram(baseInput)
    expect(prog.fitnessGoal).toBe('MUSCLE_GAIN')
  })

  it('retourne le bon niveau fitness', () => {
    const prog = generateProgram(baseInput)
    expect(prog.fitnessLevel).toBe('INTERMEDIATE')
  })

  it('génère au moins une séance', () => {
    const prog = generateProgram(baseInput)
    expect(prog.sessions.length).toBeGreaterThan(0)
  })

  it('ne génère pas plus de séances que les jours demandés', () => {
    const prog = generateProgram(baseInput)
    expect(prog.sessions.length).toBeLessThanOrEqual(baseInput.trainingDaysPerWeek)
  })

  it('chaque séance a des exercices', () => {
    const prog = generateProgram(baseInput)
    for (const session of prog.sessions) {
      expect(session.exercises.length).toBeGreaterThan(0)
    }
  })

  it('chaque exercice a un nom et des muscleGroups', () => {
    const prog = generateProgram(baseInput)
    for (const session of prog.sessions) {
      for (const ex of session.exercises) {
        expect(ex.name.length).toBeGreaterThan(0)
        expect(ex.muscleGroups.length).toBeGreaterThan(0)
      }
    }
  })

  it('fonctionne avec 3 jours (Full Body)', () => {
    const prog = generateProgram({ ...baseInput, trainingDaysPerWeek: 3 })
    expect(prog.sessions.length).toBeLessThanOrEqual(3)
  })

  it('fonctionne avec 5 jours (PPL)', () => {
    const prog = generateProgram({ ...baseInput, trainingDaysPerWeek: 5 })
    expect(prog.sessions.length).toBeLessThanOrEqual(5)
  })

  it('fonctionne avec différents objectifs', () => {
    const goals = ['WEIGHT_LOSS', 'ENDURANCE', 'GENERAL_FITNESS'] as const
    for (const goal of goals) {
      const prog = generateProgram({ ...baseInput, fitnessGoal: goal })
      expect(prog.sessions.length).toBeGreaterThan(0)
    }
  })

  it('fonctionne pour un débutant', () => {
    const prog = generateProgram({ ...baseInput, fitnessLevel: 'BEGINNER', trainingDaysPerWeek: 2 })
    expect(prog.sessions.length).toBeGreaterThan(0)
  })
})
