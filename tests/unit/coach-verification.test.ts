import { describe, expect, it } from 'vitest'
import { analyzeCoachDocument, isCoachProfileComplete } from '@/lib/coach/verification'

describe('coach verification helpers', () => {
  it('moves to admin review when document data matches the profile', () => {
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

  it('returns precise correction issues when document data is missing', () => {
    const result = analyzeCoachDocument({
      firstName: 'Alex',
      lastName:  'Martin',
      birthDate: '1990-04-12',
    })

    expect(result.status).toBe('NEEDS_CORRECTION')
    expect(result.issues.map((issue) => issue.message)).toContain('A diploma, certification, or official document must be uploaded.')
    expect(result.issues.map((issue) => issue.message)).toContain('The birth date is missing from the document.')
  })

  it('detects a complete coach profile', () => {
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
