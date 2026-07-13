'use client'
// Pricing plan card with checkout action.

import { motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'
import type { PricingPlan } from '@/types'
import { toast } from 'sonner'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { useLocale } from '@/contexts/LocaleContext'

interface Props {
  plan:     PricingPlan
  isYearly: boolean
  index:    number
}

/** Animated pricing plan card showing monthly/yearly price, feature list, current-plan badge, and a Stripe checkout action. */
export function PricingCard({ plan, isYearly, index }: Props) {
  const { t } = useLocale()
  const { plan: currentPlan } = useSubscriptionStore()
  const isCurrent = currentPlan === plan.plan
  const price     = isYearly ? plan.yearlyPrice : plan.monthlyPrice
  const isFree    = plan.monthlyPrice === 0
  const displayName = t(`pricing.plans.${plan.id}.name`)
  const displayDescription = t(`pricing.plans.${plan.id}.description`)
  const translatedFeatures = plan.features.map((feature, featureIndex) => {
    const translated = t(`pricing.plans.${plan.id}.features.${featureIndex}`)
    return translated.startsWith('pricing.') ? feature : translated
  })

  const handleCheckout = () => {
    if (isFree || isCurrent) return
    toast.info(t('pricing.paymentsSoon'))
  }

  return (
    <motion.div
      data-testid="plan-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`relative rounded-3xl p-6 flex flex-col border transition-all ${
        plan.highlighted
          ? 'border-[#C8F135] bg-[#C8F135]/5 shadow-lg shadow-[#C8F135]/10'
          : 'border-zinc-800 bg-zinc-900'
      }`}
    >
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#C8F135] text-zinc-900 text-xs font-bold">
            <Sparkles className="size-3" /> {t('pricing.popular')}
          </span>
        </div>
      )}

      <div className="mb-5">
        <h3 className="text-base font-bold text-white mb-1">{displayName.startsWith('pricing.') ? plan.name : displayName}</h3>
        <p className="text-xs text-zinc-400">{displayDescription.startsWith('pricing.') ? plan.description : displayDescription}</p>
      </div>

      <div className="mb-6">
        {isFree ? (
          <div className="text-3xl font-bold text-white">{t('pricing.free')}</div>
        ) : (
          <div>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold text-white">{price}$</span>
              <span className="text-zinc-400 text-sm mb-1">/{isYearly ? t('pricing.yearUnit') : t('pricing.monthUnit')}</span>
            </div>
            {isYearly && plan.monthlyPrice > 0 && (
              <p className="text-xs text-zinc-500 mt-0.5">
                {t('pricing.equivalent')} {(price / 12).toFixed(2)}$/{t('pricing.monthUnit')} ·{' '}
                <span className="text-[#C8F135]">
                  {t('pricing.save')} {Math.round((1 - price / (plan.monthlyPrice * 12)) * 100)}%
                </span>
              </p>
            )}
          </div>
        )}
      </div>

      <ul className="space-y-2.5 flex-1 mb-6">
        {translatedFeatures.map((feat) => (
          <li key={feat} className="flex items-start gap-2.5 text-sm">
            <Check className="size-4 text-[#C8F135] shrink-0 mt-0.5" />
            <span className="text-zinc-300">{feat}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={handleCheckout}
        disabled={!isFree || isCurrent}
        aria-label={`${t('pricing.choosePlan')} ${displayName.startsWith('pricing.') ? plan.name : displayName}`}
        className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
          isCurrent
            ? 'bg-zinc-800 text-zinc-400 cursor-default'
            : plan.highlighted
            ? 'bg-[#C8F135] text-zinc-900 hover:bg-[#d4f54d]'
            : 'bg-zinc-800 text-white hover:bg-zinc-700'
        }`}
      >
        {isCurrent ? t('pricing.current') : isFree ? t('pricing.start') : t('pricing.soon')}
      </button>
    </motion.div>
  )
}
