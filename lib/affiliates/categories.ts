import type { AffiliateCategory } from '@/types'
import type { LucideIcon } from 'lucide-react'
import { FlaskConical, Dumbbell, Shirt, BookOpen } from 'lucide-react'

export const AFFILIATE_CATEGORIES: {
  id:          AffiliateCategory
  label:       string
  icon:        LucideIcon
  description: string
}[] = [
  { id: 'SUPPLEMENTS', label: 'Suppléments', icon: FlaskConical, description: 'Protéines, créatine, vitamines…' },
  { id: 'EQUIPMENT',   label: 'Équipement',  icon: Dumbbell,     description: 'Haltères, kettlebells, bancs…' },
  { id: 'CLOTHING',    label: 'Vêtements',   icon: Shirt,        description: 'Tenues, chaussures, accessoires…' },
  { id: 'BOOKS',       label: 'Livres',      icon: BookOpen,     description: 'Guides nutrition, musculation…' },
]

export function getCategoryMeta(id: AffiliateCategory) {
  return AFFILIATE_CATEGORIES.find((c) => c.id === id)
}
