// Marketing landing page: hero, features, pricing CTA, and social proof.

import Link from 'next/link'
import { BarChart2, ShoppingBag, Star, ArrowRight, Dumbbell, Zap } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { CurrentYear } from '@/components/ui/CurrentYear'
import { PageBackground } from '@/components/landing/PageBackground'
import { HeroSection } from '@/components/landing/HeroSection'

const FEATURES = [
  { icon: Zap,         title: 'Programmes IA',     desc: 'Plans d\'entraînement générés selon votre profil et vos objectifs.' },
  { icon: BarChart2,   title: 'Suivi intelligent', desc: 'Graphiques de progression et augmentation progressive des charges.' },
  { icon: ShoppingBag, title: 'Nutrition adaptée', desc: 'Plans nutritionnels personnalisés et liste de courses générée.' },
  { icon: Dumbbell,    title: 'Multi-appareils',   desc: 'Application installable, utilisable hors ligne sur mobile et ordinateur.' },
]

const TESTIMONIALS = [
  { name: 'Marie L.',  role: 'Coureuse semi-marathon', text: 'J\'ai amélioré mon endurance de 30% en 3 mois grâce au suivi nutritionnel.', stars: 5 },
  { name: 'Thomas B.', role: 'Pratiquant CrossFit',    text: 'Les programmes générés sont parfaitement adaptés à mon niveau.', stars: 5 },
  { name: 'Sarah K.',  role: 'Perte de poids',         text: '-8kg en 4 mois avec les recettes et les calculs macro automatiques.', stars: 5 },
]

/** Public landing page showcasing BodyOps features, testimonials, and CTAs for sign-up. */
export default function LandingPage() {
  return (
    /*
     * No bg-zinc-950 here — body already has it via globals.css.
     * PageBackground is fixed (z-0); all sections are relative z-10 to sit above it.
     */
    <div className="relative min-h-screen overflow-x-hidden text-white">

      {/* Fixed full-viewport animated background */}
      <PageBackground />

      {/* Nav — fixed so it stays visible while scrolling */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md px-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 py-5">
          <Logo href="/" size="md" />
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
            <Link href="/auth/signin" className="rounded-xl bg-zinc-800 px-3 py-2 text-xs transition-colors hover:bg-zinc-700 sm:text-sm">Connexion</Link>
            <Link href="/onboarding" className="rounded-xl bg-[#C8F135] px-3 py-2 text-xs font-bold text-zinc-900 transition-colors hover:bg-[#d4f54d] sm:text-sm">Essai gratuit</Link>
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
        <h2 className="text-3xl font-bold text-center mb-12">Tout ce dont vous avez besoin</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 p-6">
              <div className="size-10 rounded-xl bg-[#C8F135]/10 flex items-center justify-center mb-4">
                <f.icon className="size-5 text-[#C8F135]" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Ce que disent nos membres</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-2xl bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 p-6">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-zinc-300 mb-4">&ldquo;{t.text}&rdquo;</p>
              <div>
                <div className="font-medium text-sm">{t.name}</div>
                <div className="text-xs text-zinc-500">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-2xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Prêt à transformer votre corps&nbsp;?</h2>
        <p className="text-zinc-400 mb-8">Rejoignez des milliers de membres qui atteignent leurs objectifs avec BodyOps.</p>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#C8F135] text-zinc-900 font-bold text-lg hover:bg-[#d4f54d] transition-colors"
        >
          Démarrer maintenant <ArrowRight className="size-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/60 px-6 py-8 text-center text-sm text-zinc-500">
        © <CurrentYear /> BodyOps · <a href="mailto:hello@bodyops.app" className="hover:text-zinc-300">Contact</a>
      </footer>
    </div>
  )
}
