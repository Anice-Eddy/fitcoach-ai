'use client'
// Manual macro adjuster: protein/carbs/fat sliders with real-time calorie recalculation.

import { useState } from 'react'
import { toast } from 'sonner'
import type { Macros } from '@/types'
import { useLocale } from '@/contexts/LocaleContext'

interface Props {
  initial:  Macros
  calories: number
  onSave:   (macros: Macros) => void
}

const MACRO_CONFIG: { key: keyof Macros; labelKey: string; color: string; kcalPer: number }[] = [
  { key: 'proteinG', labelKey: 'nutrition.protein', color: '#C8F135', kcalPer: 4 },
  { key: 'carbsG',   labelKey: 'nutrition.carbs',   color: '#38bdf8', kcalPer: 4 },
  { key: 'fatG',     labelKey: 'nutrition.fat',     color: '#f472b6', kcalPer: 9 },
]

/** Renders +/- controls for protein, carbs, and fat grams with a live calorie delta indicator; calls onSave with the adjusted macros. */
export function MacroAdjuster({ initial, calories, onSave }: Props) {
  const { t } = useLocale()
  const [macros, setMacros] = useState<Macros>(initial)

  const totalKcal = macros.proteinG * 4 + macros.carbsG * 4 + macros.fatG * 9
  const delta     = totalKcal - calories

  const update = (key: keyof Macros, val: number) => {
    setMacros((prev) => ({ ...prev, [key]: Math.max(0, val) }))
  }

  const handleSave = () => {
    onSave(macros)
    toast.success(t('macroAdjuster.saved'))
  }

  const handleReset = () => {
    setMacros(initial)
    toast.info(t('macroAdjuster.resetDone'))
  }

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{t('macroAdjuster.title')}</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          Math.abs(delta) < 50
            ? 'bg-emerald-500/10 text-emerald-400'
            : 'bg-amber-500/10 text-amber-400'
        }`}>
          {totalKcal} kcal {delta > 0 ? `+${delta}` : delta < 0 ? delta : ''}
        </span>
      </div>

      {MACRO_CONFIG.map(({ key, labelKey, color, kcalPer }) => (
        <div key={key}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-300">{t(labelKey)}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => update(key, macros[key] - 5)}
                className="size-6 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-sm font-bold flex items-center justify-center"
              >−</button>
              <span className="text-sm font-bold text-white w-12 text-center">{macros[key]}g</span>
              <button
                onClick={() => update(key, macros[key] + 5)}
                className="size-6 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-sm font-bold flex items-center justify-center"
              >+</button>
              <span className="text-xs text-zinc-500 w-14 text-right">{macros[key] * kcalPer} kcal</span>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-800">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, (macros[key] * kcalPer / calories) * 100)}%`, backgroundColor: color }}
            />
          </div>
        </div>
      ))}

      <div className="flex gap-3 pt-1">
        <button
          onClick={handleReset}
          className="flex-1 py-2 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          {t('common.reset')}
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-2 rounded-xl bg-[#C8F135] text-zinc-900 text-sm font-bold hover:bg-[#d4f54d] transition-colors"
        >
          {t('common.save')}
        </button>
      </div>
    </div>
  )
}
