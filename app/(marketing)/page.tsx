// Marketing landing page: hero, features, pricing CTA, and social proof.

import Link from 'next/link'
import { Zap, BarChart2, ShoppingBag, Star, ArrowRight, Check, Dumbbell } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

const FEATURES = [
  { icon: Zap,        title: 'Programmes IA',       desc: 'Plans d\'entraînement générés selon votre profil et vos objectifs.' },
  { icon: BarChart2,  title: 'Suivi intelligent',   desc: 'Graphiques de progression et augmentation progressive des charges.' },
  { icon: ShoppingBag,title: 'Nutrition adaptée',   desc: 'Plans nutritionnels personnalisés et liste de courses générée.' },
  { icon: Dumbbell,   title: 'Multi-appareils',     desc: 'Application installable, utilisable hors ligne sur mobile et ordinateur.' },
]

const TESTIMONIALS = [
  { name: 'Marie L.', role: 'Coureuse semi-marathon', text: 'J\'ai amélioré mon endurance de 30% en 3 mois grâce au suivi nutritionnel.', stars: 5 },
  { name: 'Thomas B.', role: 'Pratiquant CrossFit',  text: 'Les programmes générés sont parfaitement adaptés à mon niveau.', stars: 5 },
  { name: 'Sarah K.', role: 'Perte de poids',        text: '-8kg en 4 mois avec les recettes et les calculs macro automatiques.', stars: 5 },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 border-b border-zinc-800 max-w-6xl mx-auto">
        <Logo href="/" size="md" />
        <div className="flex items-center gap-3">
          <Link href="/auth/signin?callbackUrl=/coach/dashboard" className="text-sm px-4 py-2 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors">Espace Coach</Link>
          <Link href="/auth/signin" className="text-sm px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors">Connexion</Link>
          <Link href="/onboarding" className="text-sm px-4 py-2 rounded-xl bg-[#C8F135] text-zinc-900 font-bold hover:bg-[#d4f54d] transition-colors">Essai gratuit</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center px-6 py-24">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C8F135]/30 bg-[#C8F135]/10 text-[#C8F135] text-sm font-medium mb-8">
          <Zap className="size-3.5" /> Propulsé par l&apos;intelligence artificielle
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6">
          Votre coach fitness<br />
          <span className="text-[#C8F135]">personnalisé</span>, 24h/24
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
          Programmes d&apos;entraînement, nutrition adaptée et suivi de progression — tout en un.
          Commencez gratuitement, sans carte de crédit.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/onboarding"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#C8F135] text-zinc-900 font-bold text-lg hover:bg-[#d4f54d] transition-colors"
          >
            Commencer gratuitement <ArrowRight className="size-5" />
          </Link>
        </div>
        <p className="text-sm text-zinc-500 mt-4">
          <Check className="inline size-3.5 text-[#C8F135] mr-1" />Aucune CB requise
          <span className="mx-3">·</span>
          <Check className="inline size-3.5 text-[#C8F135] mr-1" />Gratuit pour commencer
          <span className="mx-3">·</span>
          <Check className="inline size-3.5 text-[#C8F135] mr-1" />Coaching IA ou humain
        </p>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Tout ce dont vous avez besoin</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
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
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Ce que disent nos membres</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
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
      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Prêt à transformer votre corps ?</h2>
        <p className="text-zinc-400 mb-8">Rejoignez des milliers de membres qui atteignent leurs objectifs avec BodyOps.</p>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#C8F135] text-zinc-900 font-bold text-lg hover:bg-[#d4f54d] transition-colors"
        >
          Démarrer maintenant <ArrowRight className="size-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-8 text-center text-sm text-zinc-500">
        © 2025 BodyOps · <a href="mailto:hello@BodyOpsai.app" className="hover:text-zinc-300">Contact</a>
      </footer>
    </div>
  )
}
