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
  it('converts 1 kg to about 2.2 lb', () => {
    expect(kgToLb(1)).toBeCloseTo(2.2, 0)
  })

  it('converts 70 kg correctly', () => {
    expect(kgToLb(70)).toBeCloseTo(154.3, 0)
  })

  it('returns 0 for 0 kg', () => {
    expect(kgToLb(0)).toBe(0)
  })
})

describe('lbToKg', () => {
  it('converts 1 lb to about 0.5 kg rounded to 1 decimal', () => {
    // 1 lb = 0.453592 kg -> rounded to 0.5 with 1 decimal.
    expect(lbToKg(1)).toBeCloseTo(0.5, 1)
  })

  it('converts 154 lb to about 70 kg', () => {
    expect(lbToKg(154)).toBeCloseTo(69.9, 0)
  })

  it('is the approximate inverse of kgToLb', () => {
    const kg = 75
    expect(lbToKg(kgToLb(kg))).toBeCloseTo(kg, 0)
  })
})

describe('cmToFtIn', () => {
  it('converts 180 cm to 5 ft 11 in', () => {
    const result = cmToFtIn(180)
    expect(result.feet).toBe(5)
    expect(result.inches).toBe(11)
  })

  it('converts 152 cm to about 5 ft 0 in with 12-inch carry', () => {
    // 152 * 0.393701 = 59.84 in -> floor(59.84/12)=4 ft, round(11.84)=12 -> carry: 5 ft 0 in.
    const result = cmToFtIn(152)
    expect(result.feet).toBe(5)
    expect(result.inches).toBe(0)
  })

  it('always returns inches below 12', () => {
    const result = cmToFtIn(175)
    expect(result.inches).toBeLessThan(12)
    expect(result.inches).toBeGreaterThanOrEqual(0)
  })
})

describe('ftInToCm', () => {
  it('converts 5 ft 11 in to about 180 cm', () => {
    expect(ftInToCm(5, 11)).toBeCloseTo(180, 0)
  })

  it('converts 6 ft 0 in to about 183 cm', () => {
    expect(ftInToCm(6, 0)).toBeCloseTo(182.88, 0)
  })

  it('is the inverse of cmToFtIn', () => {
    const cm = 175
    const { feet, inches } = cmToFtIn(cm)
    expect(ftInToCm(feet, inches)).toBeCloseTo(cm, 0)
  })
})

describe('formatWeight', () => {
  it('formats in kg', () => {
    expect(formatWeight(70.5, 'KG')).toBe('70.5 kg')
  })

  it('formats in lb', () => {
    const result = formatWeight(70, 'LB')
    expect(result).toContain('lb')
  })
})

describe('formatHeight', () => {
  it('formats in cm', () => {
    expect(formatHeight(175, 'CM')).toBe('175 cm')
  })

  it('formats in ft/in with separators', () => {
    const result = formatHeight(180, 'FT_IN')
    // Format: "5'11\"" — contains feet and inches separators
    expect(result).toContain("'")
    expect(result).toContain('"')
  })
})

describe('normalizeWeight', () => {
  it('returns the value in kg when already in KG', () => {
    expect(normalizeWeight(70, 'KG')).toBe(70)
  })

  it('converts lb to kg', () => {
    expect(normalizeWeight(154, 'LB')).toBeCloseTo(69.9, 0)
  })
})

describe('normalizeHeight', () => {
  it('returns the value in cm when already in CM', () => {
    expect(normalizeHeight(175, 'CM')).toBe(175)
  })

  it('converts 5 ft 11 in to about 180 cm', () => {
    expect(normalizeHeight(5, 'FT_IN', 11)).toBeCloseTo(180, 0)
  })
})
