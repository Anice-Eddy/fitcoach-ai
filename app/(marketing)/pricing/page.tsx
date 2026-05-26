'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Dumbbell } from 'lucide-react'
import { PLANS } from '@/lib/stripe/plans'
import { PricingCard } from '@/components/pricing/PricingCard'
import { PricingToggle } from '@/components/pricing/PricingToggle'

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#C8F135]">
              <Dumbbell className="size-4 text-zinc-900" />
            </div>
            <span className="text-lg font-semibold">BodyOps</span>
          </Link>
          <Link href="/auth/signin" className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white">
            Connexion
          </Link>
        </nav>

        <section className="mb-10 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[4px] text-[#C8F135]">Tarifs</p>
          <h1 className="text-[34px] font-medium leading-tight sm:text-[44px]">Choisis ton plan</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-400">
            Commence gratuitement, puis passe à un plan supérieur quand tu veux plus de suivi, de nutrition et d'exports.
          </p>
        </section>

        <div className="mb-8">
          <PricingToggle isYearly={isYearly} onChange={setIsYearly} />
        </div>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan, index) => (
            <PricingCard key={plan.id} plan={plan} isYearly={isYearly} index={index} />
          ))}
        </section>
      </div>
    </main>
  )
}
