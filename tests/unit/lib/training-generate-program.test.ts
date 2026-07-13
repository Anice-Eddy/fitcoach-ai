import { describe, it, expect } from 'vitest'
import { generateProgram } from '@/lib/training/generate-program'
import { EXERCISE_DATABASE, exerciseDisplayInstructions, exerciseDisplayName } from '@/lib/training/exercise-database'

const baseInput = {
  fitnessGoal:         'MUSCLE_GAIN' as const,
  fitnessLevel:        'INTERMEDIATE' as const,
  trainingDaysPerWeek: 4,
  availableEquipment:  ['BARBELL', 'DUMBBELL', 'BENCH'] as string[],
}

describe('generateProgram', () => {
  it('returns a program with an id', () => {
    const prog = generateProgram(baseInput)
    expect(prog.id).toBeTruthy()
    expect(typeof prog.id).toBe('string')
  })

  it('returns a non-empty program name', () => {
    const prog = generateProgram(baseInput)
    expect(prog.name.length).toBeGreaterThan(0)
  })

  it('localizes local program and session names when requested', () => {
    const french = generateProgram(baseInput)
    const english = generateProgram({ ...baseInput, locale: 'en' })

    expect(french.name).toContain('Programme')
    expect(english.name).toContain('Program')
    expect(english.name).toContain('Muscle gain')
    expect(french.sessions.some(session => session.name.includes('Pectoraux'))).toBe(true)
    expect(french.sessions.some(session => session.name.includes('Chest'))).toBe(false)
    expect(english.sessions.some(session => session.name.includes('Dos'))).toBe(false)
    expect(english.sessions.some(session => session.name.includes('Back'))).toBe(true)
  })

  it('localizes full-body session names in French', () => {
    const french = generateProgram({ ...baseInput, trainingDaysPerWeek: 3 })
    const english = generateProgram({ ...baseInput, trainingDaysPerWeek: 3, locale: 'en' })

    expect(french.sessions[0]?.name).toContain('Corps complet')
    expect(english.sessions[0]?.name).toContain('Full Body')
  })

  it('localizes high-frequency full-body session names in French', () => {
    const french = generateProgram({ ...baseInput, trainingDaysPerWeek: 6 })
    const english = generateProgram({ ...baseInput, trainingDaysPerWeek: 6, locale: 'en' })

    expect(french.sessions.some(session => session.name === 'Corps complet - Puissance')).toBe(true)
    expect(english.sessions.some(session => session.name === 'Full Body - Power')).toBe(true)
  })

  it('returns the requested fitness goal', () => {
    const prog = generateProgram(baseInput)
    expect(prog.fitnessGoal).toBe('MUSCLE_GAIN')
  })

  it('returns the requested fitness level', () => {
    const prog = generateProgram(baseInput)
    expect(prog.fitnessLevel).toBe('INTERMEDIATE')
  })

  it('generates at least one session', () => {
    const prog = generateProgram(baseInput)
    expect(prog.sessions.length).toBeGreaterThan(0)
  })

  it('does not generate more sessions than requested training days', () => {
    const prog = generateProgram(baseInput)
    expect(prog.sessions.length).toBeLessThanOrEqual(baseInput.trainingDaysPerWeek)
  })

  it('adds exercises to every session', () => {
    const prog = generateProgram(baseInput)
    for (const session of prog.sessions) {
      expect(session.exercises.length).toBeGreaterThan(0)
    }
  })

  it('adds a name and muscle groups to every exercise', () => {
    const prog = generateProgram(baseInput)
    for (const session of prog.sessions) {
      for (const ex of session.exercises) {
        expect(ex.name.length).toBeGreaterThan(0)
        expect(ex.muscleGroups.length).toBeGreaterThan(0)
      }
    }
  })

  it('works with 3 days for full body', () => {
    const prog = generateProgram({ ...baseInput, trainingDaysPerWeek: 3 })
    expect(prog.sessions.length).toBeLessThanOrEqual(3)
  })

  it('works with 5 days for PPL', () => {
    const prog = generateProgram({ ...baseInput, trainingDaysPerWeek: 5 })
    expect(prog.sessions.length).toBeLessThanOrEqual(5)
  })

  it('works with different goals', () => {
    const goals = ['WEIGHT_LOSS', 'ENDURANCE', 'GENERAL_FITNESS'] as const
    for (const goal of goals) {
      const prog = generateProgram({ ...baseInput, fitnessGoal: goal })
      expect(prog.sessions.length).toBeGreaterThan(0)
    }
  })

  it('works for a beginner', () => {
    const prog = generateProgram({ ...baseInput, fitnessLevel: 'BEGINNER', trainingDaysPerWeek: 2 })
    expect(prog.sessions.length).toBeGreaterThan(0)
  })
})

describe('exerciseDisplayName', () => {
  it('keeps stored French names stable while exposing English labels', () => {
    const bench = EXERCISE_DATABASE.find(exercise => exercise.id === 'ex-bench-press')
    expect(bench?.name).toBe('Développé couché')
    expect(exerciseDisplayName('Développé couché', 'en')).toBe('Barbell bench press')
    expect(exerciseDisplayName('Développé couché', 'fr')).toBe('Développé couché')
  })

  it('does not expose obvious French exercise names in English mode', () => {
    const frenchNamePattern = /[éèêëàâùûçîïôöœÉÈÊËÀÂÙÛÇÎÏÔÖŒ]|\b(Développé|haltère|haltères|Tractions|Soulevé|Élévation|Écartés|Tirage|Fentes|Mollets|Presse|Pompes|Corde|Câble|Genoux|Relevé|Poignets)\b/i

    const untranslated = EXERCISE_DATABASE
      .map((exercise) => [exercise.id, exerciseDisplayName(exercise, 'en')] as const)
      .filter(([, name]) => frenchNamePattern.test(name))

    expect(untranslated).toEqual([])
  })

  it('does not expose French instructions in English mode when a detailed translation is missing', () => {
    const exercise = EXERCISE_DATABASE.find(item => item.id === 'ex-box-jump')
    expect(exercise).toBeTruthy()

    const instructions = exerciseDisplayInstructions(exercise!, 'en')

    expect(instructions.length).toBeGreaterThan(0)
    expect(instructions.join(' ')).not.toMatch(/[éèêàùçîôû]/i)
  })
})
