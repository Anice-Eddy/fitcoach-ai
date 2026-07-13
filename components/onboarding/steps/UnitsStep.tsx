'use client'

import { useState } from 'react'
import { Scale, Ruler } from 'lucide-react'
import { useLocale } from '@/contexts/LocaleContext'

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
  const { t } = useLocale()
  const [weightUnit, setWeightUnit] = useState<'KG' | 'LB'>(defaultValues?.weightUnit ?? 'KG')
  const [heightUnit, setHeightUnit] = useState<'CM' | 'FT_IN'>(defaultValues?.heightUnit ?? 'CM')

  const handleSubmit = () => {
    onNext({ weightUnit, heightUnit })
  }

  return (
    <div className="space-y-6">

      {/* Weight unit */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Scale className="size-4 text-[#C8F135]" />
          <label className="text-sm font-semibold text-white">{t('onboarding.units.weightUnit')}</label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: 'KG', labelKey: 'onboarding.units.kilograms', subKey: 'onboarding.units.kgRegion' },
            { value: 'LB', labelKey: 'onboarding.units.pounds',    subKey: 'onboarding.units.lbRegion' },
          ] as const).map(({ value, labelKey, subKey }) => (
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
              <div className="text-sm font-medium text-white">{t(labelKey)}</div>
              <div className="text-xs text-zinc-400 mt-0.5">{t(subKey)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Height unit */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Ruler className="size-4 text-[#C8F135]" />
          <label className="text-sm font-semibold text-white">{t('onboarding.units.heightUnit')}</label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: 'CM',    labelKey: 'onboarding.units.centimeters', subKey: 'onboarding.units.cmRegion' },
            { value: 'FT_IN', labelKey: 'onboarding.units.feetInches',  subKey: 'onboarding.units.ftRegion' },
          ] as const).map(({ value, labelKey, subKey }) => (
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
              <div className="text-sm font-medium text-white">{t(labelKey)}</div>
              <div className="text-xs text-zinc-400 mt-0.5">{t(subKey)}</div>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className="w-full py-3.5 rounded-xl bg-[#C8F135] text-zinc-900 font-bold text-sm hover:bg-[#d4f54d] transition-colors mt-2"
      >
        {t('onboarding.continue')}
      </button>
    </div>
  )
}
