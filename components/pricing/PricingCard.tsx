'use client'
// Carte de plan tarifaire — highlight, features, bouton checkout

import { motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'
import type { PricingPlan } from '@/types'
import { useState } from 'react'
import { toast } from 'sonner'
import { useSubscriptionStore } from '@/stores/subscriptionStore'

interface Props {
  plan:     PricingPlan
  isYearly: boolean
  index:    number
}

export function PricingCard({ plan, isYearly, index }: Props) {
  const [loading, setLoading] = useState(false)
  const { plan: currentPlan } = useSubscriptionStore()
  const isCurrent = currentPlan === plan.plan
  const price     = isYearly ? plan.yearlyPrice : plan.monthlyPrice
  const priceId   = isYearly ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly
  const isFree    = plan.monthlyPrice === 0
  const isBusinessMocked = plan.plan === 'BUSINESS'

  const handleCheckout = async () => {
    if (isFree || isCurrent) return
    if (isBusinessMocked) { toast.info('Le plan Business arrive bientôt !'); return }
    if (!priceId) { toast.error('Plan non configuré'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ priceId, interval: isYearly ? 'year' : 'month' }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else toast.error('Erreur lors de la création de la session')
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
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
            <Sparkles className="size-3" /> Plus populaire
          </span>
        </div>
      )}

      <div className="mb-5">
        <h3 className="text-base font-bold text-white mb-1">{plan.name}</h3>
        <p className="text-xs text-zinc-400">{plan.description}</p>
      </div>

      <div className="mb-6">
        {isFree ? (
          <div className="text-3xl font-bold text-white">Gratuit</div>
        ) : (
          <div>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold text-white">{price}$</span>
              <span className="text-zinc-400 text-sm mb-1">/{isYearly ? 'an' : 'mois'}</span>
            </div>
            {isYearly && plan.monthlyPrice > 0 && (
              <p className="text-xs text-zinc-500 mt-0.5">
                soit {(price / 12).toFixed(2)}$/mois · <span className="text-[#C8F135]">économisez {Math.round((1 - price / (plan.monthlyPrice * 12)) * 100)}%</span>
              </p>
            )}
          </div>
        )}
      </div>

      <ul className="space-y-2.5 flex-1 mb-6">
        {plan.features.map((feat) => (
          <li key={feat} className="flex items-start gap-2.5 text-sm">
            <Check className="size-4 text-[#C8F135] shrink-0 mt-0.5" />
            <span className="text-zinc-300">{feat}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleCheckout}
        disabled={loading || isCurrent}
        className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
          isCurrent
            ? 'bg-zinc-800 text-zinc-400 cursor-default'
            : plan.highlighted
            ? 'bg-[#C8F135] text-zinc-900 hover:bg-[#d4f54d]'
            : 'bg-zinc-800 text-white hover:bg-zinc-700'
        }`}
      >
        {loading ? 'Chargement…' : isCurrent ? 'Plan actuel' : isFree ? 'Commencer gratuitement' : isBusinessMocked ? 'Bientôt disponible' : 'Choisir ce plan'}
      </button>
    </motion.div>
  )
}
