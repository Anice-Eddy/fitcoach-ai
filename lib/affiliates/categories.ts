import type { AffiliateCategory } from '@/types'
import type { LucideIcon } from 'lucide-react'
import { FlaskConical, Dumbbell, Shirt, BookOpen } from 'lucide-react'

export const AFFILIATE_CATEGORIES: {
  id:          AffiliateCategory
  label:       string
  icon:        LucideIcon
  description: string
}[] = [
  { id: 'SUPPLEMENTS', label: 'Supplements', icon: FlaskConical, description: 'Protein, creatine, vitamins...' },
  { id: 'EQUIPMENT',   label: 'Equipment',   icon: Dumbbell,     description: 'Dumbbells, kettlebells, benches...' },
  { id: 'CLOTHING',    label: 'Clothing',    icon: Shirt,        description: 'Outfits, shoes, accessories...' },
  { id: 'BOOKS',       label: 'Books',       icon: BookOpen,     description: 'Nutrition and training guides...' },
]

export function getCategoryMeta(id: AffiliateCategory) {
  return AFFILIATE_CATEGORIES.find((c) => c.id === id)
}
