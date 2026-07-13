import type { AffiliateProduct } from '@/types'
import type { Locale } from '@/lib/i18n'

const TAG_EN: Record<string, string> = {
  'acides aminés': 'amino acids',
  'récupération': 'recovery',
  'magnésium': 'magnesium',
  'anti-fatigue': 'anti-fatigue',
  'immunité': 'immunity',
  'brûle-graisses': 'fat burner',
  'énergie': 'energy',
  'vitamines': 'vitamins',
  'minéraux': 'minerals',
  'sangles': 'lifting straps',
  'femme': 'women',
  'musculation': 'strength training',
  'élastiques': 'resistance bands',
  'résistance': 'resistance',
  'gants': 'gloves',
  'encyclopédie': 'encyclopedia',
  'anatomie': 'anatomy',
  'créatine': 'creatine',
  'protéine végétale': 'plant protein',
  'vanille': 'vanilla',
  'chocolat': 'chocolate',
  'concentré': 'concentrate',
  'caséine': 'casein',
  'nuit': 'night',
  'métabolisme': 'metabolism',
  'synthèse protéique': 'protein synthesis',
  'libération lente': 'slow release',
}

const EN_CATEGORY_FALLBACK_DESCRIPTION: Record<AffiliateProduct['category'], string> = {
  SUPPLEMENTS: 'Supplement selected for BodyOps users.',
  EQUIPMENT:   'Training equipment selected for BodyOps users.',
  CLOTHING:    'Training apparel selected for BodyOps users.',
  BOOKS:       'Training or nutrition guide selected for BodyOps users.',
}

const FRENCH_COPY_PATTERN = /[éèêëàâùûçîïôöœÉÈÊËÀÂÙÛÇÎÏÔÖŒ]|\b(avec|pour|sans|sur|par|une|des|les|dans|idéal|idéale|saveur|protéine|protéines|entraînement|récupération)\b/i

/** Returns the market title; product titles are real catalog names, so they are not auto-translated. */
export function affiliateProductName(product: AffiliateProduct, locale: Locale = 'fr') {
  return locale === 'en' ? (product.nameEn ?? product.name) : product.name
}

/** Returns localized product copy when provided, otherwise falls back to the source catalog copy. */
export function affiliateProductDescription(product: AffiliateProduct, locale: Locale = 'fr') {
  if (locale !== 'en') return product.description
  if (product.descriptionEn) return product.descriptionEn
  if (!product.description) return undefined

  // Avoid showing French catalog copy in English mode when a product has not been translated yet.
  if (FRENCH_COPY_PATTERN.test(product.description)) {
    return EN_CATEGORY_FALLBACK_DESCRIPTION[product.category]
  }

  return product.description
}

/** Localizes common tags without changing catalog metadata. */
export function affiliateProductTags(product: AffiliateProduct, locale: Locale = 'fr') {
  if (locale !== 'en') return product.tags
  return product.tagsEn ?? product.tags.map((tag) => TAG_EN[tag.toLowerCase()] ?? tag)
}
