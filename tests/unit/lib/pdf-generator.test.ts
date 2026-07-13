import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UserProfile } from '@/lib/storage/StorageAdapter'
import { exportProfilePDF } from '@/lib/exports/pdf-generator'

const textCalls: string[] = []
const saveMock = vi.fn()

vi.mock('jspdf', () => {
  function JsPDFMock() {
    return {
      setFillColor: vi.fn(),
      rect: vi.fn(),
      setTextColor: vi.fn(),
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn((value: string) => {
        textCalls.push(value)
      }),
      save: saveMock,
    }
  }

  return { jsPDF: JsPDFMock }
})

const profile = {
  firstName: 'Eddy',
  age: 28,
  weightKg: 89,
  heightCm: 183,
  fitnessGoal: 'GENERAL_FITNESS',
  fitnessLevel: 'ADVANCED',
  bmi: 26.6,
  bmr: 1900,
  tdee: 2500,
  recommendedCalories: 2300,
  recommendedProteinG: 180,
  recommendedCarbsG: 240,
  recommendedFatG: 70,
} as UserProfile

describe('pdf generator localization', () => {
  beforeEach(() => {
    textCalls.length = 0
    saveMock.mockClear()
  })

  it('uses polished French labels in profile exports', async () => {
    await exportProfilePDF(profile, 'fr')

    expect(textCalls).toContain('Prénom')
    expect(textCalls).toContain('Âge')
    expect(textCalls).toContain('Mesures calculées')
    expect(textCalls).toContain('Calories recommandées')
    expect(textCalls).toContain('Forme générale')
    expect(textCalls).toContain('Avancé')
  })

  it('keeps English labels in profile exports', async () => {
    await exportProfilePDF(profile, 'en')

    expect(textCalls).toContain('First name')
    expect(textCalls).toContain('Calculated metrics')
    expect(textCalls).toContain('Recommended calories')
    expect(textCalls).toContain('General fitness')
    expect(textCalls).toContain('Advanced')
  })
})
