import { describe, expect, it } from 'vitest'
import { analyzeCoachDocument, isCoachProfileComplete } from '@/lib/coach/verification'

describe('coach verification helpers', () => {
  it('passe en attente admin quand les donnees du document correspondent au profil', () => {
    const result = analyzeCoachDocument({
      firstName:        'Alex',
      lastName:         'Martin',
      birthDate:        '1990-04-12',
      documentName:     'diplome-alex-martin-12-04-1990.pdf',
      documentMimeType: 'application/pdf',
    })

    expect(result.status).toBe('PENDING_VERIFICATION')
    expect(result.issues).toHaveLength(0)
  })

  it('retourne des corrections precises quand les donnees sont manquantes', () => {
    const result = analyzeCoachDocument({
      firstName: 'Alex',
      lastName:  'Martin',
      birthDate: '1990-04-12',
    })

    expect(result.status).toBe('NEEDS_CORRECTION')
    expect(result.issues.map((issue) => issue.message)).toContain('Un diplôme, une certification ou un document officiel doit être envoyé.')
    expect(result.issues.map((issue) => issue.message)).toContain('La date de naissance est manquante sur le document.')
  })

  it('detecte un profil coach complet', () => {
    expect(isCoachProfileComplete({
      firstName:       'Alex',
      lastName:        'Martin',
      birthDate:       new Date('1990-04-12'),
      bio:             'Coach professionnel certifie avec une approche complete.',
      specialties:     ['Musculation'],
      certifications:  ['BPJEPS'],
      yearsExperience: 5,
      documentFileName: 'diplome.pdf',
    })).toBe(true)
  })
})
