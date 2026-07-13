'use client'
// Monthly/yearly toggle for the pricing page.

import { useLocale } from '@/contexts/LocaleContext'

interface Props {
  isYearly:  boolean
  onChange:  (yearly: boolean) => void
}

/** Monthly/yearly billing toggle switch for the pricing page. */
export function PricingToggle({ isYearly, onChange }: Props) {
  const { t } = useLocale()

  return (
    <div className="flex items-center gap-3 justify-center">
      <span className={`text-sm font-medium ${!isYearly ? 'text-white' : 'text-zinc-400'}`}>{t('pricing.monthly')}</span>
      <button
        type="button"
        onClick={() => onChange(!isYearly)}
        aria-label={isYearly ? t('pricing.showMonthly') : t('pricing.showYearly')}
        className={`relative w-12 h-6 rounded-full transition-colors ${isYearly ? 'bg-[#C8F135]' : 'bg-zinc-700'}`}
      >
        <div className={`absolute top-1 size-4 rounded-full bg-white shadow transition-transform ${isYearly ? 'translate-x-7' : 'translate-x-1'}`} />
      </button>
      <span className={`text-sm font-medium ${isYearly ? 'text-white' : 'text-zinc-400'}`}>
        {t('pricing.yearly')}
        <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded bg-[#C8F135]/15 text-[#C8F135] font-semibold">-33%</span>
      </span>
    </div>
  )
}
