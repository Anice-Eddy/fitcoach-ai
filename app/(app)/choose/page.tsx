'use client'

import { useRouter } from 'next/navigation'
import { Check, ArrowRight, Square } from 'lucide-react'
import { useUserStore } from '@/stores/userStore'

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
    <div className="mx-auto mb-6 flex size-[70px] items-center justify-center rounded-full border border-[#C8F135]/45 bg-[#C8F135]/10">
      <Square className="size-5 text-[#C8F135]" />
    </div>
  )
}

/** Onboarding choice page: lets the user select a solo or coached accompaniment mode before proceeding. */
export default function ChoosePage() {
  const router = useRouter()
  const { setAccompanimentMode, setCoach } = useUserStore()

  const chooseAI = () => {
    setAccompanimentMode('AI')
    setCoach({ name: null, nextSession: null })
    router.push('/dashboard')
  }

  const chooseCoach = () => {
    router.push('/coaches')
  }

  return (
    <div className="min-h-screen bg-black px-0 py-8 text-white">
      <section className="mx-auto flex min-h-[700px] max-w-6xl flex-col items-center rounded-lg bg-[#0b0d09] px-4 py-16">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[5px] text-[#C8F135]">
          Choisis ton accompagnement
        </p>
        <h1 className="mb-3 text-center text-[32px] font-medium leading-tight text-white sm:text-[42px]">
          Comment veux-tu être coaché ?
        </h1>
        <p className="mb-14 max-w-xl text-center text-sm text-zinc-400">
          Ton profil est prêt. Choisis maintenant ton mode d'accompagnement.
        </p>

      <div className="grid w-full max-w-[940px] grid-cols-1 gap-6 md:grid-cols-2">
        {/* AI coaching option */}
        <div className="flex min-h-[460px] flex-col rounded-[18px] border border-zinc-700 bg-[#181b15] p-9 text-center">
          <CardIcon />
          <h2 className="mb-3 text-xl font-medium text-white">Coaching IA</h2>
          <p className="mb-8 min-h-[52px] text-sm leading-relaxed text-zinc-400">
            Programme généré automatiquement selon ton profil, tes objectifs et ton niveau.
          </p>
          <ul className="mb-8 space-y-2 text-left">
            {AI_BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-2.5 text-xs text-zinc-400">
                <Check className="size-3.5 shrink-0 text-[#C8F135]" />
                {b}
              </li>
            ))}
          </ul>
          <button
            type="button"
            aria-label="Commencer avec le coaching IA"
            onClick={chooseAI}
            className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-[#C8F135] py-4 text-sm font-medium text-black transition-colors hover:bg-[#d4f54d] disabled:opacity-50"
          >
            Commencer avec l'IA <ArrowRight className="size-4" />
          </button>
        </div>

        {/* Real coach option */}
        <div className="relative flex min-h-[460px] flex-col rounded-[18px] border-2 border-[#C8F135] bg-[#181b15] p-9 text-center">
          {/* Recommended badge */}
          <div className="absolute right-0 top-0">
            <span className="rounded-bl-xl rounded-tr-[14px] bg-[#C8F135] px-5 py-1.5 text-[10px] font-medium tracking-wide text-black">
              RECOMMANDÉ
            </span>
          </div>

          <CardIcon />
          <h2 className="mb-3 text-xl font-medium text-white">Coach réel</h2>
          <p className="mb-8 min-h-[52px] text-sm leading-relaxed text-zinc-400">
            Un vrai coach certifié analyse ton profil et crée ton programme sur mesure.
          </p>
          <ul className="mb-8 space-y-2 text-left">
            {COACH_BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-2.5 text-xs text-zinc-400">
                <Check className="size-3.5 shrink-0 text-[#C8F135]" />
                {b}
              </li>
            ))}
          </ul>
          <button
            type="button"
            aria-label="Prendre rendez-vous avec un coach réel"
            onClick={chooseCoach}
            className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-[#C8F135] py-4 text-sm font-medium text-black transition-colors hover:bg-[#d4f54d] disabled:opacity-50"
          >
            Prendre rendez-vous <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
      </section>
    </div>
  )
}
