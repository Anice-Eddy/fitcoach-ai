'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PLANS } from '@/lib/stripe/plans'
import { Logo } from '@/components/ui/Logo'
import { PricingCard } from '@/components/pricing/PricingCard'
import { PricingToggle } from '@/components/pricing/PricingToggle'
import { useLocale } from '@/contexts/LocaleContext'

/** Pricing page with monthly/yearly toggle; renders plan cards and FAQs. */
export default function PricingPage() {
  const { t } = useLocale()
  const [isYearly, setIsYearly] = useState(false)

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-12 flex items-center justify-between">
          <Logo href="/" size="md" />
          <div className="flex items-center gap-2">
            <Link href="/auth/signin" className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white">
              {t('auth.signIn')}
            </Link>
          </div>
        </nav>

        <section className="mb-10 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[4px] text-[#C8F135]">{t('pricing.eyebrow')}</p>
          <h1 className="text-[34px] font-medium leading-tight sm:text-[44px]">{t('pricing.title')}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-400">
            {t('pricing.description')}
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
