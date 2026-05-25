// Catégories d'affiliation avec métadonnées UI

import type { AffiliateCategory } from '@/types'

export const AFFILIATE_CATEGORIES: {
  id: AffiliateCategory
  label: string
  emoji: string
  description: string
}[] = [
  { id: 'SUPPLEMENTS', label: 'Suppléments',  emoji: '💊', description: 'Protéines, créatine, vitamines…' },
  { id: 'EQUIPMENT',   label: 'Équipement',   emoji: '🏋️', description: 'Haltères, kettlebells, bancs…' },
  { id: 'CLOTHING',    label: 'Vêtements',    emoji: '👟', description: 'Tenues, chaussures, accessoires…' },
  { id: 'BOOKS',       label: 'Livres',       emoji: '📚', description: 'Guides nutrition, musculation…' },
]

export function getCategoryMeta(id: AffiliateCategory) {
  return AFFILIATE_CATEGORIES.find((c) => c.id === id)
}
