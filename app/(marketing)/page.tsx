// Marketing landing page: hero, features, pricing CTA, and social proof.

'use client'

import Link from 'next/link'
import { BarChart2, ShoppingBag, Star, ArrowRight, Dumbbell, Zap } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { CurrentYear } from '@/components/ui/CurrentYear'
import { PageBackground } from '@/components/landing/PageBackground'
import { HeroSection } from '@/components/landing/HeroSection'
import { useLocale } from '@/contexts/LocaleContext'
import { formattedAppVersion } from '@/lib/app-version'

const FEATURES = [
  { icon: Zap,         titleKey: 'landing.features.aiPrograms.title',        descKey: 'landing.features.aiPrograms.description' },
  { icon: BarChart2,   titleKey: 'landing.features.smartTracking.title',     descKey: 'landing.features.smartTracking.description' },
  { icon: ShoppingBag, titleKey: 'landing.features.adaptiveNutrition.title', descKey: 'landing.features.adaptiveNutrition.description' },
  { icon: Dumbbell,    titleKey: 'landing.features.multiDevice.title',       descKey: 'landing.features.multiDevice.description' },
]

const TESTIMONIALS = [
  { nameKey: 'landing.testimonials.marie.name',  roleKey: 'landing.testimonials.marie.role',  textKey: 'landing.testimonials.marie.text',  stars: 5 },
  { nameKey: 'landing.testimonials.thomas.name', roleKey: 'landing.testimonials.thomas.role', textKey: 'landing.testimonials.thomas.text', stars: 5 },
  { nameKey: 'landing.testimonials.sarah.name',  roleKey: 'landing.testimonials.sarah.role',  textKey: 'landing.testimonials.sarah.text',  stars: 5 },
]

/** Public landing page showcasing BodyOps features, testimonials, and CTAs for sign-up. */
export default function LandingPage() {
  const { t } = useLocale()

  return (
    /*
     * No bg-zinc-950 here — body already has it via globals.css.
     * PageBackground is fixed (z-0); all sections are relative z-10 to sit above it.
     */
    <div className="relative min-h-screen overflow-x-hidden text-white">

      {/* Fixed full-viewport animated background */}
      <PageBackground />

      {/* Fixed nav so it stays visible while scrolling. */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md px-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 py-5">
          <Logo href="/" size="md" />
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
            <Link href="/auth/signin" className="rounded-xl bg-zinc-800 px-3 py-2 text-xs transition-colors hover:bg-zinc-700 sm:text-sm">{t('auth.signIn')}</Link>
            <Link href="/auth/register" className="rounded-xl bg-[#C8F135] px-3 py-2 text-xs font-bold text-zinc-900 transition-colors hover:bg-[#d4f54d] sm:text-sm">{t('landing.freeTrial')}</Link>
          </div>
        </div>
      </nav>

      {/* Spacer to offset the fixed nav height (~72px) */}
      <div className="h-[72px]" aria-hidden />

      {/* Hero */}
      <div className="relative z-10">
        <HeroSection />
      </div>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">{t('landing.featuresTitle')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div key={f.titleKey} className="rounded-2xl bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 p-6">
              <div className="size-10 rounded-xl bg-[#C8F135]/10 flex items-center justify-center mb-4">
                <f.icon className="size-5 text-[#C8F135]" />
              </div>
              <h3 className="font-semibold mb-2">{t(f.titleKey)}</h3>
              <p className="text-sm text-zinc-400">{t(f.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">{t('landing.testimonialsTitle')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial) => (
            <div key={testimonial.nameKey} className="rounded-2xl bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 p-6">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: testimonial.stars }).map((_, i) => (
                  <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-zinc-300 mb-4">&ldquo;{t(testimonial.textKey)}&rdquo;</p>
              <div>
                <div className="font-medium text-sm">{t(testimonial.nameKey)}</div>
                <div className="text-xs text-zinc-500">{t(testimonial.roleKey)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-2xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">{t('landing.ctaTitle')}</h2>
        <p className="text-zinc-400 mb-8">{t('landing.ctaDescription')}</p>
        <Link
          href="/auth/register"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#C8F135] text-zinc-900 font-bold text-lg hover:bg-[#d4f54d] transition-colors"
        >
          {t('pricing.start')} <ArrowRight className="size-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/60 px-6 py-8 text-sm text-zinc-500">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© <CurrentYear /> BodyOps · {formattedAppVersion()}</span>
          <div className="flex items-center gap-5">
            <Link href="/terms"   className="hover:text-zinc-300 transition-colors">{t('common.terms')}</Link>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">{t('common.privacy')}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
