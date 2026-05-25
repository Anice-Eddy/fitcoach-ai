'use client'
// Page pricing — toggle mensuel/annuel + cards des plans
import { useState } from 'react'
import { PricingCard }   from '@/components/pricing/PricingCard'
import { PricingToggle } from '@/components/pricing/PricingToggle'
import { PLANS }         from '@/lib/stripe/plans'
import Link from 'next/link'
import { Dumbbell, ArrowLeft } from 'lucide-react'

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-[#C8F135] flex items-center justify-center">
            <Dumbbell className="size-4 text-zinc-900" />
          </div>
          <span className="font-bold text-lg">FitCoach<span className="text-[#C8F135]">AI</span></span>
        </Link>
        <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
          <ArrowLeft className="size-4" /> Mon dashboard
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">Choisissez votre plan</h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto">
            Commencez gratuitement. Passez à Pro quand vous êtes prêt à aller plus loin.
          </p>
          <div className="mt-8">
            <PricingToggle isYearly={isYearly} onChange={setIsYearly} />
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map((plan, i) => (
            <PricingCard key={plan.id} plan={plan} isYearly={isYearly} index={i} />
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center">
          <p className="text-sm text-zinc-400">
            Questions ? <a href="mailto:hello@fitcoachai.app" className="text-[#C8F135] hover:underline">Contactez-nous</a>
            {' · '}Essai gratuit 7 jours sur les plans payants · Sans engagement · Annulation à tout moment
          </p>
        </div>
      </main>
    </div>
  )
}
