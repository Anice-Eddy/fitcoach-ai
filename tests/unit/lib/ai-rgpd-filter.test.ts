import { describe, it, expect } from 'vitest'
import { sanitizeContextForAI } from '@/lib/ai/context'

describe('sanitizeContextForAI — filtrage RGPD', () => {
  it('masque les adresses email', () => {
    const result = sanitizeContextForAI('contact: john.doe@example.com disponible')
    expect(result).not.toContain('john.doe@example.com')
    expect(result).toContain('[email]')
  })

  it('masque un email en milieu de phrase', () => {
    const result = sanitizeContextForAI('PROFIL: poids 87 kg | email: coach@bodyops.fr | niveau: ADVANCED')
    expect(result).not.toContain('coach@bodyops.fr')
    expect(result).toContain('[email]')
  })

  it('masque un numéro de téléphone français mobile', () => {
    const result = sanitizeContextForAI('tel: 06 12 34 56 78 disponible')
    expect(result).not.toContain('06 12 34 56 78')
    expect(result).toContain('[tél]')
  })

  it('masque un numéro avec indicatif international +33', () => {
    const result = sanitizeContextForAI('contact: +33 6 12 34 56 78')
    expect(result).not.toContain('+33 6 12 34 56 78')
    expect(result).toContain('[tél]')
  })

  it('ne modifie pas les données fitness sans PII', () => {
    const input = 'PROFIL: poids 87 kg | objectif: WEIGHT_LOSS | niveau: INTERMEDIATE'
    expect(sanitizeContextForAI(input)).toBe(input)
  })

  it('préserve les chiffres de performance', () => {
    const input = 'DERNIÈRES SÉANCES: 12/05(5ex CHEST) | 14/05(4ex BACK)'
    expect(sanitizeContextForAI(input)).toBe(input)
  })

  it('gère un texte vide', () => {
    expect(sanitizeContextForAI('')).toBe('')
  })

  it('masque plusieurs PII dans le même texte', () => {
    const input = 'email: user@test.fr | tel: 07 98 76 54 32 | poids: 80 kg'
    const result = sanitizeContextForAI(input)
    expect(result).not.toContain('user@test.fr')
    expect(result).not.toContain('07 98 76 54 32')
    expect(result).toContain('80 kg')
  })
})
