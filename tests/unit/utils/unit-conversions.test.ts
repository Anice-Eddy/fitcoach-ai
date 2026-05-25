import { describe, it, expect } from 'vitest'
import {
  kgToLb,
  lbToKg,
  cmToFtIn,
  ftInToCm,
  formatWeight,
  formatHeight,
  normalizeWeight,
  normalizeHeight,
} from '@/utils/unit-conversions'

describe('kgToLb', () => {
  it('convertit 1 kg en ~2.2 lb', () => {
    expect(kgToLb(1)).toBeCloseTo(2.2, 0)
  })

  it('convertit 70 kg correctement', () => {
    expect(kgToLb(70)).toBeCloseTo(154.3, 0)
  })

  it('retourne 0 pour 0 kg', () => {
    expect(kgToLb(0)).toBe(0)
  })
})

describe('lbToKg', () => {
  it('convertit 1 lb en ~0.5 kg (arrondi 1 décimale)', () => {
    // 1 lb = 0.453592 kg → arrondi à 0.5 avec 1 décimale
    expect(lbToKg(1)).toBeCloseTo(0.5, 1)
  })

  it('convertit 154 lb en ~70 kg', () => {
    expect(lbToKg(154)).toBeCloseTo(69.9, 0)
  })

  it('est l\'inverse approximatif de kgToLb', () => {
    const kg = 75
    expect(lbToKg(kgToLb(kg))).toBeCloseTo(kg, 0)
  })
})

describe('cmToFtIn', () => {
  it('convertit 180 cm en 5 ft 11 in', () => {
    const result = cmToFtIn(180)
    expect(result.feet).toBe(5)
    expect(result.inches).toBe(11)
  })

  it('152 cm donne environ 5 ft 0 in (carry des 12 pouces)', () => {
    // 152 * 0.393701 = 59.84 in → floor(59.84/12)=4 ft, round(11.84)=12 → carry: 5 ft 0 in
    const result = cmToFtIn(152)
    expect(result.feet).toBe(5)
    expect(result.inches).toBe(0)
  })

  it('retourne toujours des pouces < 12', () => {
    const result = cmToFtIn(175)
    expect(result.inches).toBeLessThan(12)
    expect(result.inches).toBeGreaterThanOrEqual(0)
  })
})

describe('ftInToCm', () => {
  it('convertit 5 ft 11 in en ~180 cm', () => {
    expect(ftInToCm(5, 11)).toBeCloseTo(180, 0)
  })

  it('convertit 6 ft 0 in en ~183 cm', () => {
    expect(ftInToCm(6, 0)).toBeCloseTo(182.88, 0)
  })

  it('est l\'inverse de cmToFtIn', () => {
    const cm = 175
    const { feet, inches } = cmToFtIn(cm)
    expect(ftInToCm(feet, inches)).toBeCloseTo(cm, 0)
  })
})

describe('formatWeight', () => {
  it('formate en kg', () => {
    expect(formatWeight(70.5, 'KG')).toBe('70.5 kg')
  })

  it('formate en lb', () => {
    const result = formatWeight(70, 'LB')
    expect(result).toContain('lb')
  })
})

describe('formatHeight', () => {
  it('formate en cm', () => {
    expect(formatHeight(175, 'CM')).toBe('175 cm')
  })

  it('formate en ft/in avec séparateurs', () => {
    const result = formatHeight(180, 'FT_IN')
    // Format: "5'11\"" — contains feet and inches separators
    expect(result).toContain("'")
    expect(result).toContain('"')
  })
})

describe('normalizeWeight', () => {
  it('retourne la valeur en kg si déjà en KG', () => {
    expect(normalizeWeight(70, 'KG')).toBe(70)
  })

  it('convertit les lb en kg', () => {
    expect(normalizeWeight(154, 'LB')).toBeCloseTo(69.9, 0)
  })
})

describe('normalizeHeight', () => {
  it('retourne la valeur en cm si déjà en CM', () => {
    expect(normalizeHeight(175, 'CM')).toBe(175)
  })

  it('convertit 5 ft 11 in en ~180 cm', () => {
    expect(normalizeHeight(5, 'FT_IN', 11)).toBeCloseTo(180, 0)
  })
})
