'use client'

import { ShoppingBag } from 'lucide-react'
import { AFFILIATE_CATEGORIES } from '@/lib/affiliates/categories'
import type { AffiliateCategory } from '@/types'
import type { LucideIcon } from 'lucide-react'

interface Props {
  selected: AffiliateCategory | 'ALL'
  onChange: (cat: AffiliateCategory | 'ALL') => void
  counts:   Record<string, number>
}

export function CategoryFilter({ selected, onChange, counts }: Props) {
  const all: { id: AffiliateCategory | 'ALL'; label: string; icon: LucideIcon }[] = [
    { id: 'ALL', label: 'Tous', icon: ShoppingBag },
    ...AFFILIATE_CATEGORIES.map((c) => ({ id: c.id, label: c.label, icon: c.icon })),
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {all.map((cat) => {
        const Icon   = cat.icon
        const count  = cat.id === 'ALL' ? Object.values(counts).reduce((a, b) => a + b, 0) : (counts[cat.id] ?? 0)
        const active = selected === cat.id

        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              active
                ? 'bg-[#C8F135] text-zinc-900'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <Icon className="size-3.5" />
            {cat.label}
            <span className={`text-xs px-1 rounded ${active ? 'bg-zinc-900/20' : 'bg-zinc-700 text-zinc-400'}`}>
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
