'use client'

import { useState } from 'react'
import { Scale, Ruler } from 'lucide-react'

interface UnitsData {
  weightUnit: 'KG' | 'LB'
  heightUnit: 'CM' | 'FT_IN'
}

interface Props {
  defaultValues?: Partial<UnitsData>
  onNext: (data: UnitsData) => void
}

/** First onboarding step that lets the user choose their preferred weight (kg/lb) and height (cm/ft-in) units. */
export function UnitsStep({ defaultValues, onNext }: Props) {
  const [weightUnit, setWeightUnit] = useState<'KG' | 'LB'>(defaultValues?.weightUnit ?? 'KG')
  const [heightUnit, setHeightUnit] = useState<'CM' | 'FT_IN'>(defaultValues?.heightUnit ?? 'CM')

  const handleSubmit = () => {
    onNext({ weightUnit, heightUnit })
  }

  return (
    <div className="space-y-6">

      {/* Unité de poids */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Scale className="size-4 text-[#C8F135]" />
          <label className="text-sm font-semibold text-white">Unité de poids</label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: 'KG', label: 'Kilogrammes', sub: 'kg — Europe, Canada' },
            { value: 'LB', label: 'Livres',       sub: 'lb — États-Unis, UK' },
          ] as const).map(({ value, label, sub }) => (
            <button
              key={value}
              type="button"
              onClick={() => setWeightUnit(value)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                weightUnit === value
                  ? 'border-[#C8F135] bg-[#C8F135]/10'
                  : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
              }`}
            >
              <div className={`text-2xl font-bold mb-1 ${weightUnit === value ? 'text-[#C8F135]' : 'text-white'}`}>
                {value}
              </div>
              <div className="text-sm font-medium text-white">{label}</div>
              <div className="text-xs text-zinc-400 mt-0.5">{sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Unité de taille */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Ruler className="size-4 text-[#C8F135]" />
          <label className="text-sm font-semibold text-white">Unité de taille</label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: 'CM',    label: 'Centimètres', sub: 'cm — Europe, Canada' },
            { value: 'FT_IN', label: 'Pieds / Pouces', sub: 'ft/in — États-Unis, UK' },
          ] as const).map(({ value, label, sub }) => (
            <button
              key={value}
              type="button"
              onClick={() => setHeightUnit(value)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                heightUnit === value
                  ? 'border-[#C8F135] bg-[#C8F135]/10'
                  : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
              }`}
            >
              <div className={`text-2xl font-bold mb-1 ${heightUnit === value ? 'text-[#C8F135]' : 'text-white'}`}>
                {value === 'CM' ? 'cm' : 'ft'}
              </div>
              <div className="text-sm font-medium text-white">{label}</div>
              <div className="text-xs text-zinc-400 mt-0.5">{sub}</div>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className="w-full py-3.5 rounded-xl bg-[#C8F135] text-zinc-900 font-bold text-sm hover:bg-[#d4f54d] transition-colors mt-2"
      >
        Continuer →
      </button>
    </div>
  )
}
