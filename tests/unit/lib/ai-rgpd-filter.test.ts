import { describe, it, expect } from 'vitest'
import { sanitizeContextForAI } from '@/lib/ai/context'

describe('sanitizeContextForAI — GDPR filtering', () => {
  it('masks email addresses', () => {
    const result = sanitizeContextForAI('contact: john.doe@example.com disponible')
    expect(result).not.toContain('john.doe@example.com')
    expect(result).toContain('[email]')
  })

  it('masks an email in the middle of a sentence', () => {
    const result = sanitizeContextForAI('PROFIL: poids 87 kg | email: coach@bodyops.fr | niveau: ADVANCED')
    expect(result).not.toContain('coach@bodyops.fr')
    expect(result).toContain('[email]')
  })

  it('masks a French mobile phone number', () => {
    const result = sanitizeContextForAI('tel: 06 12 34 56 78 disponible')
    expect(result).not.toContain('06 12 34 56 78')
    expect(result).toContain('[phone]')
  })

  it('masks a phone number with the +33 international prefix', () => {
    const result = sanitizeContextForAI('contact: +33 6 12 34 56 78')
    expect(result).not.toContain('+33 6 12 34 56 78')
    expect(result).toContain('[phone]')
  })

  it('does not change fitness data without PII', () => {
    const input = 'PROFIL: poids 87 kg | objectif: WEIGHT_LOSS | niveau: INTERMEDIATE'
    expect(sanitizeContextForAI(input)).toBe(input)
  })

  it('preserves performance numbers', () => {
    const input = 'DERNIÈRES SÉANCES: 12/05(5ex CHEST) | 14/05(4ex BACK)'
    expect(sanitizeContextForAI(input)).toBe(input)
  })

  it('handles empty text', () => {
    expect(sanitizeContextForAI('')).toBe('')
  })

  it('masks multiple PII values in the same text', () => {
    const input = 'email: user@test.fr | tel: 07 98 76 54 32 | poids: 80 kg'
    const result = sanitizeContextForAI(input)
    expect(result).not.toContain('user@test.fr')
    expect(result).not.toContain('07 98 76 54 32')
    expect(result).toContain('80 kg')
  })
})
