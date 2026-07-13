import { describe, expect, it } from 'vitest'
import type { AffiliateProduct } from '@/types'
import { affiliateProductDescription, affiliateProductName, affiliateProductTags } from '@/lib/affiliates/display'

const product: AffiliateProduct = {
  id: 'test',
  name: 'Créatine Monohydrate',
  description: 'Créatine pour la force.',
  descriptionEn: 'Creatine for strength.',
  category: 'SUPPLEMENTS',
  affiliateUrl: 'https://example.com',
  commissionRateMin: 1,
  commissionRateMax: 2,
  fitnessGoals: ['MUSCLE_GAIN'],
  tags: ['créatine', 'récupération'],
}

const untranslatedProduct: AffiliateProduct = {
  ...product,
  id:            'untranslated',
  description:   'Créatine pour améliorer la force et la récupération.',
  descriptionEn: undefined,
}

const englishSourceProduct: AffiliateProduct = {
  ...product,
  id:            'english-source',
  description:   'Creatine for strength and recovery.',
  descriptionEn: undefined,
}

describe('affiliate display helpers', () => {
  it('keeps real catalog titles unless an English title is explicitly provided', () => {
    expect(affiliateProductName(product, 'en')).toBe('Créatine Monohydrate')
  })

  it('uses English descriptions when available', () => {
    expect(affiliateProductDescription(product, 'en')).toBe('Creatine for strength.')
    expect(affiliateProductDescription(product, 'fr')).toBe('Créatine pour la force.')
  })

  it('avoids showing untranslated French product copy in English mode', () => {
    expect(affiliateProductDescription(untranslatedProduct, 'en')).toBe('Supplement selected for BodyOps users.')
    expect(affiliateProductDescription(untranslatedProduct, 'fr')).toBe('Créatine pour améliorer la force et la récupération.')
  })

  it('keeps source descriptions that are already English', () => {
    expect(affiliateProductDescription(englishSourceProduct, 'en')).toBe('Creatine for strength and recovery.')
  })

  it('localizes common tags without changing the source tags', () => {
    expect(affiliateProductTags(product, 'en')).toEqual(['creatine', 'recovery'])
    expect(product.tags).toEqual(['créatine', 'récupération'])
  })
})
