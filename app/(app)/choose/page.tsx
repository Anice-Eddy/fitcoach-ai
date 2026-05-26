'use client'

import { useRouter } from 'next/navigation'
import { Check, ArrowRight } from 'lucide-react'

const AI_BENEFITS = [
  'Démarrage immédiat',
  'Programme personnalisé IA',
  'Plan nutrition complet',
  'Suivi automatique',
]

const COACH_BENEFITS = [
  'Entretien découverte gratuit',
  'Programme 100% humain',
  'Suivi personnalisé continu',
  'Ajustements en temps réel',
]

function CardIcon() {
  return (
    <div className="size-14 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-5">
      <div className="size-7 rounded-md border-2 border-zinc-500" />
    </div>
  )
}

export default function ChoosePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <p className="text-xs font-bold tracking-widest text-[#C8F135] uppercase mb-4">
        Choisis ton accompagnement
      </p>
      <h1 className="text-3xl sm:text-4xl font-bold text-white text-center mb-3">
        Comment veux-tu être coaché&nbsp;?
      </h1>
      <p className="text-zinc-400 text-sm text-center mb-10 max-w-md">
        Ton profil est prêt. Choisis maintenant ton mode d'accompagnement pour commencer.
      </p>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl">
        {/* Coaching IA */}
        <div className="flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 p-7 text-center">
          <CardIcon />
          <h2 className="text-xl font-bold text-white mb-2">Coaching IA</h2>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
            Programme généré automatiquement selon ton profil, tes objectifs et ton niveau.
          </p>
          <ul className="space-y-2.5 mb-8 text-left">
            {AI_BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-2.5 text-sm text-zinc-300">
                <Check className="size-3.5 text-[#C8F135] shrink-0" />
                {b}
              </li>
            ))}
          </ul>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-auto w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#C8F135] text-zinc-900 font-bold text-sm hover:bg-[#d4f54d] transition-colors"
          >
            Commencer avec l'IA <ArrowRight className="size-4" />
          </button>
        </div>

        {/* Coach Réel */}
        <div className="relative flex flex-col rounded-2xl bg-zinc-900 border border-[#C8F135]/30 p-7 text-center">
          {/* Badge RECOMMANDÉ */}
          <div className="absolute top-4 right-4">
            <span className="px-2.5 py-1 rounded-md bg-[#C8F135] text-zinc-900 text-[10px] font-bold tracking-wide">
              RECOMMANDÉ
            </span>
          </div>

          <CardIcon />
          <h2 className="text-xl font-bold text-white mb-2">Coach Réel</h2>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
            Un vrai coach certifié analyse ton profil et crée ton programme sur mesure.
          </p>
          <ul className="space-y-2.5 mb-8 text-left">
            {COACH_BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-2.5 text-sm text-zinc-300">
                <Check className="size-3.5 text-[#C8F135] shrink-0" />
                {b}
              </li>
            ))}
          </ul>
          <button
            onClick={() => router.push('/coaches/coach-1')}
            className="mt-auto w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-[#C8F135] text-[#C8F135] font-bold text-sm hover:bg-[#C8F135]/10 transition-colors"
          >
            Prendre rendez-vous <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
