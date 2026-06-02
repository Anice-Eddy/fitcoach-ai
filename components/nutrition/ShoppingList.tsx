'use client'
// Liste de courses groupée par catégorie avec ajout manuel, export texte et impression PDF

import { useState } from 'react'
import { Check, ShoppingCart, Download, Printer, RotateCcw, Plus, CheckCheck } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import type { GroupedShoppingList, FoodCategory, ShoppingItem } from '@/lib/nutrition/shopping-list'
import { shoppingListToText } from '@/lib/nutrition/shopping-list'

const CATEGORY_ICONS: Record<FoodCategory, string> = {
  'Protéines':         '🥩',
  'Glucides':          '🍚',
  'Lipides':           '🥑',
  'Légumes':           '🥦',
  'Fruits':            '🍎',
  'Produits laitiers': '🥛',
  'Autres':            '🛒',
}

interface Props {
  grouped: GroupedShoppingList
}

/** Renders a grouped, checkable shopping list with manual add, check-all, text export and print support. */
export function ShoppingList({ grouped }: Props) {
  const [checked,   setChecked]   = useState<Set<string>>(new Set())
  const [custom,    setCustom]    = useState<ShoppingItem[]>([])
  const [inputVal,  setInputVal]  = useState('')

  const allItems: ShoppingItem[] = [...Object.values(grouped).flat(), ...custom]
  const total = allItems.length
  const done  = allItems.filter(i => checked.has(i.name)).length
  const allChecked = total > 0 && done === total

  const toggle = (name: string) =>
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name); else next.add(name)
      return next
    })

  const toggleAll = () => {
    if (allChecked) {
      setChecked(new Set())
    } else {
      setChecked(new Set(allItems.map(i => i.name)))
    }
  }

  const addCustomItem = () => {
    const name = inputVal.trim()
    if (!name) return
    if (allItems.some(i => i.name.toLowerCase() === name.toLowerCase())) {
      setInputVal('')
      return
    }
    setCustom(prev => [...prev, { name, totalGrams: 0, category: 'Autres' as const }])
    setInputVal('')
  }

  const downloadText = () => {
    const allGrouped: GroupedShoppingList = { ...grouped }
    if (custom.length > 0) {
      allGrouped['Autres'] = [...(allGrouped['Autres'] ?? []), ...custom]
    }
    const text = shoppingListToText(allGrouped)
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'liste-de-courses.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (total === 0 && custom.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart className="size-6" />}
        title="Aucun article"
        description="Générez un plan nutritionnel pour créer votre liste de courses."
      />
    )
  }

  const nonEmptyCategories = (Object.entries(grouped) as [FoodCategory, ShoppingItem[]][])
    .filter(([, items]) => items.length > 0)

  return (
    <div className="space-y-5 print:space-y-4">
      {/* Manual add input */}
      <div className="flex gap-2 print:hidden">
        <input
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addCustomItem() }}
          placeholder="Ajouter un article manuellement…"
          className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#C8F135] transition-colors"
        />
        <button
          onClick={addCustomItem}
          disabled={!inputVal.trim()}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-zinc-700 text-sm text-zinc-300 hover:border-[#C8F135]/50 hover:text-white disabled:opacity-40 transition-colors"
        >
          <Plus className="size-4" /> Ajouter
        </button>
      </div>

      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 print:hidden">
        <p className="text-sm text-zinc-400">
          <span className="text-[#C8F135] font-semibold">{done}</span>/{total} articles cochés
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAll}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <CheckCheck className="size-3" /> {allChecked ? 'Tout décocher' : 'Tout cocher'}
          </button>
          <button
            onClick={() => setChecked(new Set())}
            className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <RotateCcw className="size-3" /> Réinit.
          </button>
          <button
            onClick={downloadText}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 text-xs text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
          >
            <Download className="size-3" /> Texte
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 text-xs text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
          >
            <Printer className="size-3" /> PDF
          </button>
        </div>
      </div>

      {/* Grouped list */}
      {nonEmptyCategories.map(([category, items]) => (
        <div key={category}>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span>{CATEGORY_ICONS[category]}</span>
            {category}
            <span className="ml-auto text-zinc-600 normal-case tracking-normal">
              {items.filter(i => checked.has(i.name)).length}/{items.length}
            </span>
          </h3>
          <div className="space-y-1.5">
            {items.map(item => {
              const isChecked = checked.has(item.name)
              return (
                <button
                  key={item.name}
                  onClick={() => toggle(item.name)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                    isChecked
                      ? 'border-zinc-700 bg-zinc-800/40 opacity-60'
                      : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  <div className={`size-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isChecked ? 'border-[#C8F135] bg-[#C8F135]' : 'border-zinc-600'
                  }`}>
                    {isChecked && <Check className="size-3 text-zinc-900" />}
                  </div>
                  <span className={`flex-1 text-sm ${isChecked ? 'line-through text-zinc-500' : 'text-white'}`}>
                    {item.name}
                  </span>
                  <span className="text-xs text-zinc-500 shrink-0">{Math.round(item.totalGrams)} g</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Custom items */}
      {custom.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span>✏️</span> Ajoutés manuellement
            <span className="ml-auto text-zinc-600 normal-case tracking-normal">
              {custom.filter(i => checked.has(i.name)).length}/{custom.length}
            </span>
          </h3>
          <div className="space-y-1.5">
            {custom.map(item => {
              const isChecked = checked.has(item.name)
              return (
                <button
                  key={item.name}
                  onClick={() => toggle(item.name)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                    isChecked
                      ? 'border-zinc-700 bg-zinc-800/40 opacity-60'
                      : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  <div className={`size-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isChecked ? 'border-[#C8F135] bg-[#C8F135]' : 'border-zinc-600'
                  }`}>
                    {isChecked && <Check className="size-3 text-zinc-900" />}
                  </div>
                  <span className={`flex-1 text-sm ${isChecked ? 'line-through text-zinc-500' : 'text-white'}`}>
                    {item.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Print-only header */}
      <style>{`
        @media print {
          nav, header, button, .print\\:hidden { display: none !important; }
          body { background: white !important; color: black !important; }
        }
      `}</style>
    </div>
  )
}
