'use client'
// Orchestrateur du stepper onboarding — gère l'état, les animations et la sauvegarde
// deps: npm install framer-motion @hookform/resolvers

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { IdentityStep }      from './steps/IdentityStep'
import { MeasurementsStep }  from './steps/MeasurementsStep'
import { ActivityStep }      from './steps/ActivityStep'
import { GoalsStep }         from './steps/GoalsStep'
import { DietStep }          from './steps/DietStep'
import { SummaryStep }       from './steps/SummaryStep'
import { useUserStore }      from '@/stores/userStore'
import { LocalStorageAdapter } from '@/lib/storage/LocalStorageAdapter'
import type { OnboardingData } from '@/utils/validators'

const STEPS = [
  { id: 1, title: 'Identité',       desc: 'Qui es-tu ?' },
  { id: 2, title: 'Mensurations',   desc: 'Ton corps aujourd\'hui' },
  { id: 3, title: 'Activité',       desc: 'Ton mode de vie' },
  { id: 4, title: 'Objectifs',      desc: 'Où veux-tu aller ?' },
  { id: 5, title: 'Alimentation',   desc: 'Tes préférences' },
  { id: 6, title: 'Ton profil',     desc: 'Résumé calculé' },
]

const slideVariants = {
  enter:  (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

export function OnboardingStepper() {
  const router        = useRouter()
  const { setProfile } = useUserStore()
  const [step, setStep]      = useState(0)
  const [direction, setDir]  = useState(1)
  const [data, setData]      = useState<Partial<OnboardingData>>({})
  const [saving, setSaving]  = useState(false)
  const storage = new LocalStorageAdapter()

  const goNext = async (stepData: Partial<OnboardingData>) => {
    const merged = { ...data, ...stepData }
    setData(merged)
    await storage.saveOnboardingProgress(step + 1, merged)
    setDir(1)
    setStep((s) => s + 1)
  }

  const goBack = () => { setDir(-1); setStep((s) => s - 1) }

  const finish = async () => {
    setSaving(true)
    try {
      const profile = await storage.saveProfile({
        ...(data as OnboardingData),
        onboardingCompleted: true,
        language: 'fr',
        darkMode: true,
        id:       crypto.randomUUID(),
      })
      setProfile(profile)
      await storage.clearOnboardingProgress()
      toast.success('Profil créé ! Bienvenue sur FitCoach AI 🎉')
      router.push('/dashboard')
    } catch {
      toast.error('Erreur lors de la sauvegarde. Réessaie.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Barre de progression */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-400">Étape {step + 1} sur {STEPS.length}</span>
          <span className="text-sm font-medium text-[#C8F135]">{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#C8F135] rounded-full"
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
        <div className="mt-3">
          <h2 className="text-lg font-bold text-white">{STEPS[step].title}</h2>
          <p className="text-sm text-zinc-400">{STEPS[step].desc}</p>
        </div>
      </div>

      {/* Contenu animé de l'étape */}
      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={step}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          {step === 0 && <IdentityStep     defaultValues={data} onNext={goNext} />}
          {step === 1 && <MeasurementsStep defaultValues={data} onNext={goNext} onBack={goBack} />}
          {step === 2 && <ActivityStep     defaultValues={data} onNext={goNext} onBack={goBack} />}
          {step === 3 && <GoalsStep        defaultValues={data} onNext={goNext} onBack={goBack} />}
          {step === 4 && <DietStep         defaultValues={data} onNext={goNext} onBack={goBack} />}
          {step === 5 && (
            <SummaryStep
              data={data as OnboardingData}
              onFinish={finish}
              onBack={goBack}
              isLoading={saving}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
