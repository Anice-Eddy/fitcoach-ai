'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { UnitsStep }        from './steps/UnitsStep'
import { IdentityStep }     from './steps/IdentityStep'
import { MeasurementsStep } from './steps/MeasurementsStep'
import { ActivityStep }     from './steps/ActivityStep'
import { GoalsStep }        from './steps/GoalsStep'
import { DietStep }         from './steps/DietStep'
import { SummaryStep }      from './steps/SummaryStep'
import { useUserStore }     from '@/stores/userStore'
import { LocalStorageAdapter } from '@/lib/storage/LocalStorageAdapter'
import type { OnboardingData } from '@/utils/validators'
import { getInitialOnboardingStep, profileToOnboardingData } from '@/utils/onboarding-profile'
import type { UserProfile } from '@/lib/storage/StorageAdapter'

// This component can be used both for first onboarding and profile updates.
// It therefore hydrates its form from the current profile before showing steps.

const STEPS = [
  { title: 'Unités de mesure', desc: 'Kg ou lb ? Cm ou ft ?' },
  { title: 'Identité',         desc: 'Qui es-tu ?' },
  { title: 'Mensurations',     desc: 'Ton corps aujourd\'hui' },
  { title: 'Activité',         desc: 'Ton mode de vie' },
  { title: 'Objectifs',        desc: 'Où veux-tu aller ?' },
  { title: 'Alimentation',     desc: 'Tes préférences' },
  { title: 'Ton profil',       desc: 'Résumé calculé' },
]

const slideVariants = {
  enter:  (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

export function OnboardingStepper() {
  const router         = useRouter()
  const { profile, setProfile } = useUserStore()
  const [step, setStep]     = useState(0)
  const [direction, setDir] = useState(1)
  const [saving, setSaving] = useState(false)
  const [hydrating, setHydrating] = useState(true)
  const [data, setData]     = useState<Partial<OnboardingData & { weightUnit: 'KG'|'LB'; heightUnit: 'CM'|'FT_IN' }>>({
    weightUnit: 'KG',
    heightUnit: 'CM',
  })

  const storage = new LocalStorageAdapter()

  useEffect(() => {
    let mounted = true

    async function hydrateOnboarding() {
      const progress = await storage.getOnboardingProgress()
      const localProfile = await storage.getProfile()
      let cloudProfile = null

      try {
        const response = await fetch('/api/user/profile')
        cloudProfile = response.ok ? await response.json() : null
      } catch {
        cloudProfile = null
      }

      const source = (profile ?? cloudProfile ?? localProfile) as UserProfile | null
      const nextData = {
        weightUnit: 'KG' as const,
        heightUnit: 'CM' as const,
        ...(source ? profileToOnboardingData(source) : {}),
        ...(progress?.data ?? {}),
      }

      if (!mounted) return
      if (source) setProfile(source)
      setData(nextData)
      setStep(getInitialOnboardingStep({
        completed: source?.onboardingCompleted,
        savedStep: progress?.step ?? null,
        totalSteps: STEPS.length,
      }))
      setHydrating(false)
    }

    hydrateOnboarding()
    return () => { mounted = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goNext = async (stepData: Partial<OnboardingData>) => {
    const merged = { ...data, ...stepData }
    setData(merged)
    await storage.saveOnboardingProgress(step + 1, merged)
    setDir(1)
    setStep((s) => s + 1)
  }

  const goBack = () => {
    setDir(-1)
    setStep((s) => s - 1)
  }

  const finish = async () => {
    setSaving(true)
    try {
      const payload = {
        ...(data as OnboardingData),
        onboardingCompleted: true,
        language: 'fr',
        darkMode: true,
        id:       crypto.randomUUID(),
      }
      let savedProfile = await storage.saveProfile(payload)

      try {
        const response = await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (response.ok) savedProfile = await response.json()
      } catch {
        // Local mode is valid when the API is unavailable.
      }

      setProfile(savedProfile)
      await storage.clearOnboardingProgress()
      toast.success('Profil prêt. Choisis maintenant ton accompagnement.')
      router.push('/choose')
    } catch {
      toast.error('Erreur lors de la sauvegarde. Réessaie.')
    } finally {
      setSaving(false)
    }
  }

  const total     = STEPS.length
  const progress  = Math.round(((step + 1) / total) * 100)
  const current   = STEPS[step]

  if (hydrating) {
    return (
      <div className="w-full max-w-lg mx-auto rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-sm text-zinc-400">
        Chargement de ton profil...
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-400">
            Étape {step + 1} sur {total}
          </span>
          <span className="text-sm font-medium text-[#C8F135]">{progress}%</span>
        </div>

        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#C8F135] rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex gap-1.5 mt-3">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-0.5 rounded-full transition-colors duration-300 ${
                i <= step ? 'bg-[#C8F135]' : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>

        <div className="mt-3">
          <h2 className="text-xl font-bold text-white">{current.title}</h2>
          <p className="text-sm text-zinc-400">{current.desc}</p>
        </div>
      </div>

      {/* Animated step content */}
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
          {step === 0 && (
            <UnitsStep
              defaultValues={{ weightUnit: data.weightUnit, heightUnit: data.heightUnit }}
              onNext={goNext}
            />
          )}
          {step === 1 && (
            <IdentityStep defaultValues={data} onNext={goNext} onBack={goBack} />
          )}
          {step === 2 && (
            <MeasurementsStep
              defaultValues={data}
              weightUnit={data.weightUnit ?? 'KG'}
              heightUnit={data.heightUnit ?? 'CM'}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 3 && (
            <ActivityStep defaultValues={data} onNext={goNext} onBack={goBack} />
          )}
          {step === 4 && (
            <GoalsStep defaultValues={data} onNext={goNext} onBack={goBack} />
          )}
          {step === 5 && (
            <DietStep defaultValues={data} onNext={goNext} onBack={goBack} />
          )}
          {step === 6 && (
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
