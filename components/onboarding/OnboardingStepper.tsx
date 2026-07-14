'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { ShieldCheck } from 'lucide-react'
import { UnitsStep }        from './steps/UnitsStep'
import { IdentityStep }     from './steps/IdentityStep'
import { MeasurementsStep } from './steps/MeasurementsStep'
import { ActivityStep }     from './steps/ActivityStep'
import { GoalsStep }        from './steps/GoalsStep'
import { HealthStep }       from './steps/HealthStep'
import { DietStep }         from './steps/DietStep'
import { SummaryStep }      from './steps/SummaryStep'
import { useUserStore }     from '@/stores/userStore'
import { LocalStorageAdapter } from '@/lib/storage/LocalStorageAdapter'
import type { OnboardingData } from '@/utils/validators'
import { getInitialOnboardingStep, profileToOnboardingData } from '@/utils/onboarding-profile'
import type { UserProfile } from '@/lib/storage/StorageAdapter'
import { useLocale } from '@/contexts/LocaleContext'
import { healthDataConsentForLocale } from '@/lib/legal/consent'

// This component can be used both for first onboarding and profile updates.
// It therefore hydrates its form from the current profile before showing steps.

const STEP_KEYS = ['units', 'identity', 'measurements', 'activity', 'goals', 'health', 'diet', 'summary'] as const
type OnboardingDraft = Partial<OnboardingData & {
  weightUnit: 'KG'|'LB'
  heightUnit: 'CM'|'FT_IN'
  healthDataConsentAccepted: boolean
}>

const slideVariants = {
  enter:  (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

/** Multi-step animated onboarding form that hydrates from localStorage, cloud profile, or saved progress; persists each step and saves the final profile on completion. */
export function OnboardingStepper() {
  const { t, locale } = useLocale()
  const router         = useRouter()
  const { update: updateSession } = useSession()
  const { profile, setProfile } = useUserStore()
  const [step, setStep]     = useState(0)
  const [direction, setDir] = useState(1)
  const [saving, setSaving] = useState(false)
  const [hydrating, setHydrating] = useState(true)
  const [data, setData]     = useState<OnboardingDraft>({
    weightUnit: 'KG',
    heightUnit: 'CM',
  })
  const [healthConsentAccepted, setHealthConsentAccepted] = useState(false)

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
      const hasRecordedHealthConsent = Boolean(source?.healthDataConsentAt || (progress?.data as OnboardingDraft | undefined)?.healthDataConsentAccepted)
      const nextData: OnboardingDraft = {
        weightUnit: 'KG' as const,
        heightUnit: 'CM' as const,
        ...(source ? profileToOnboardingData(source) : {}),
        ...(progress?.data ?? {}),
        healthDataConsentAccepted: hasRecordedHealthConsent,
      }

      if (!mounted) return
      if (source) setProfile(source)
      setData(nextData)
      setHealthConsentAccepted(hasRecordedHealthConsent)
      setStep(getInitialOnboardingStep({
        completed: source?.onboardingCompleted,
        savedStep: progress?.step ?? null,
        totalSteps: STEP_KEYS.length,
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

  const acceptHealthConsent = async () => {
    const merged: OnboardingDraft = { ...data, healthDataConsentAccepted: true }
    setData(merged)
    setHealthConsentAccepted(true)
    await storage.saveOnboardingProgress(step, merged as Partial<OnboardingData>)
  }

  const finish = async () => {
    setSaving(true)
    try {
      const payload = {
        ...(data as OnboardingData),
        onboardingCompleted: true,
        language: locale,
        darkMode: true,
        id:       crypto.randomUUID(),
        ...healthDataConsentForLocale(locale),
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
      await updateSession()
      await storage.clearOnboardingProgress()
      toast.success(t('onboarding.profileReady'))
      router.push('/choose?returnTo=/dashboard')
    } catch {
      toast.error(t('onboarding.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const total     = STEP_KEYS.length
  const progress  = Math.round(((step + 1) / total) * 100)
  const currentKey = STEP_KEYS[step]

  if (hydrating) {
    return (
      <div className="w-full max-w-lg mx-auto rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-sm text-zinc-400">
        {t('onboarding.loadingProfile')}
      </div>
    )
  }

  if (!healthConsentAccepted) {
    return (
      <div className="w-full max-w-lg mx-auto rounded-2xl border border-zinc-800 bg-zinc-950/90 p-6 shadow-2xl shadow-black/30">
        <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#C8F135]/10 text-[#C8F135]">
          <ShieldCheck className="size-6" />
        </div>
        <h2 className="text-xl font-bold text-white">{t('legalConsent.health.title')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{t('legalConsent.health.body')}</p>
        <ul className="mt-4 space-y-2 text-sm text-zinc-400">
          <li>{t('legalConsent.health.items.body')}</li>
          <li>{t('legalConsent.health.items.goals')}</li>
          <li>{t('legalConsent.health.items.nutrition')}</li>
          <li>{t('legalConsent.health.items.ai')}</li>
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-zinc-500">
          {t('legalConsent.health.linksPrefix')}{' '}
          <Link href="/privacy" target="_blank" className="text-[#C8F135] underline-offset-4 hover:underline">
            {t('common.privacy')}
          </Link>{' '}
          {t('legalConsent.account.and')}{' '}
          <Link href="/terms" target="_blank" className="text-[#C8F135] underline-offset-4 hover:underline">
            {t('common.terms')}
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={acceptHealthConsent}
          className="mt-6 w-full rounded-xl bg-[#C8F135] px-4 py-3 text-sm font-bold text-zinc-950 transition-colors hover:bg-[#d4f54d]"
        >
          {t('legalConsent.health.accept')}
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-400">
            {t('onboarding.stepProgress')} {step + 1} {t('onboarding.stepProgressMiddle')} {total}
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
          {STEP_KEYS.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-0.5 rounded-full transition-colors duration-300 ${
                i <= step ? 'bg-[#C8F135]' : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>

        <div className="mt-3">
          <h2 className="text-xl font-bold text-white">{t(`onboarding.stepsMeta.${currentKey}.title`)}</h2>
          <p className="text-sm text-zinc-400">{t(`onboarding.stepsMeta.${currentKey}.description`)}</p>
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
            <HealthStep defaultValues={data} onNext={goNext} onBack={goBack} />
          )}
          {step === 6 && (
            <DietStep defaultValues={data} onNext={goNext} onBack={goBack} />
          )}
          {step === 7 && (
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
