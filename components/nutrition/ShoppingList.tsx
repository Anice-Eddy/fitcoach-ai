'use client'
// Liste de courses générée depuis le plan nutritionnel

import { useState } from 'react'
import { Check, ShoppingCart } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

interface ShoppingItem { name: string; totalGrams: number; category: string }
interface Props         { items: Record<string, ShoppingItem> }

/** Renders a checkable shopping list from the aggregated food items map; checked items are struck through and dimmed. */
export function ShoppingList({ items }: Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const entries = Object.entries(items)

  if (entries.length === 0) {
    return <EmptyState icon={<ShoppingCart className="size-6" />} title="Aucun article" description="Générez un plan nutritionnel pour créer votre liste de courses." />
  }

  const toggle = (name: string) =>
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })

  const done = checked.size
  const total = entries.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">{done}/{total} articles cochés</p>
        <button onClick={() => setChecked(new Set())} className="text-xs text-zinc-500 hover:text-white">Tout décocher</button>
      </div>

      <div className="space-y-2">
        {entries.map(([key, item]) => {
          const isChecked = checked.has(key)
          return (
            <button key={key} onClick={() => toggle(key)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                isChecked ? 'border-zinc-700 bg-zinc-800/50 opacity-60' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
              }`}
            >
              <div className={`size-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'border-[#C8F135] bg-[#C8F135]' : 'border-zinc-600'}`}>
                {isChecked && <Check className="size-3 text-zinc-900" />}
              </div>
              <span className={`flex-1 text-sm ${isChecked ? 'line-through text-zinc-500' : 'text-white'}`}>{item.name}</span>
              <span className="text-xs text-zinc-500">{Math.round(item.totalGrams)}g</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
