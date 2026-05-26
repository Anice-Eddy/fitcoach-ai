'use client'

import { useRouter } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Bot, User, Check, Star } from 'lucide-react'

const AI_BENEFITS = [
  'Programme généré en quelques secondes',
  'Plan nutrition personnalisé',
  'Adapté à ton équipement et tes objectifs',
  'Dashboard et suivi intégrés',
  'Ajustement automatique chaque semaine',
]

const COACH_BENEFITS = [
  'Entretien découverte gratuit',
  'Coach humain qui valide ton programme IA',
  'Suivi quotidien personnalisé',
  'Modifications en temps réel',
  'Accès à l\'agenda du coach en ligne',
]

export default function ChoosePage() {
  const router = useRouter()

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-3">Comment veux-tu être accompagné ?</h1>
          <p className="text-zinc-400 text-base max-w-lg mx-auto">
            Ton profil est prêt. Choisis maintenant ton mode d'accompagnement pour commencer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coaching IA */}
          <div className="relative flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 p-6 hover:border-zinc-700 transition-colors">
            <div className="size-12 rounded-xl bg-[#C8F135]/10 flex items-center justify-center mb-4">
              <Bot className="size-6 text-[#C8F135]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Coaching IA</h2>
            <p className="text-sm text-zinc-400 mb-5">
              Programme et nutrition générés automatiquement par l'IA, adaptés à ton profil.
            </p>
            <ul className="space-y-2.5 mb-8 flex-1">
              {AI_BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-zinc-300">
                  <Check className="size-4 text-[#C8F135] shrink-0 mt-0.5" />
                  {b}
                </li>
              ))}
            </ul>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3.5 rounded-xl bg-[#C8F135] text-zinc-900 font-bold hover:bg-[#d4f54d] transition-colors"
            >
              Commencer maintenant
            </button>
          </div>

          {/* Coach Réel */}
          <div className="relative flex flex-col rounded-2xl bg-zinc-900 border-2 border-[#C8F135]/40 p-6 hover:border-[#C8F135]/60 transition-colors">
            {/* Badge recommandé */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C8F135] text-zinc-900 text-xs font-bold">
                <Star className="size-3 fill-zinc-900" />
                Recommandé
              </div>
            </div>

            <div className="size-12 rounded-xl bg-zinc-800 flex items-center justify-center mb-4">
              <User className="size-6 text-zinc-300" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Coach Réel</h2>
            <p className="text-sm text-zinc-400 mb-5">
              Un coach professionnel supervise ton programme IA et t'accompagne au quotidien.
            </p>
            <ul className="space-y-2.5 mb-8 flex-1">
              {COACH_BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-zinc-300">
                  <Check className="size-4 text-[#C8F135] shrink-0 mt-0.5" />
                  {b}
                </li>
              ))}
            </ul>
            <button
              onClick={() => router.push('/coaches/coach-1')}
              className="w-full py-3.5 rounded-xl border-2 border-[#C8F135] text-[#C8F135] font-bold hover:bg-[#C8F135]/10 transition-colors"
            >
              Prendre rendez-vous
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-8">
          Tu pourras changer de mode à tout moment depuis les paramètres.
        </p>
      </div>
    </PageWrapper>
  )
}
