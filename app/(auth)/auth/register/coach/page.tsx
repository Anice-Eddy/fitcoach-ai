'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ChevronLeft, Check } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { toast } from 'sonner'
import { PageBackground } from '@/components/landing/PageBackground'
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons'
import { canUseFirebaseAuth, canUseNextAuth, publicAuthProviderMode } from '@/lib/auth/provider-mode'
import { firebaseEmailRegister } from '@/lib/firebase/client'
import { signInBodyOpsWithFirebaseCredential } from '@/lib/firebase/bodyops-auth'
import { useLocale } from '@/contexts/LocaleContext'
import { LegalConsentCheckbox } from '@/components/legal/LegalConsentCheckbox'
import { legalAcceptanceForLocale } from '@/lib/legal/consent'

const SPECIALTIES = [
  // Stored specialty values remain stable; display labels are resolved through SPECIALTY_I18N.
  'Force & Powerlifting', 'Hypertrophie', 'Perte de poids', 'Cardio & Endurance',
  'Nutrition sportive', 'Réhabilitation', 'CrossFit', 'Course à pied',
  'Yoga & Souplesse', 'Boxe & Arts martiaux', 'Natation', 'Préparation physique',
]

const CERTIFICATIONS = [
  // Stored certification values remain stable; display labels are resolved through CERTIFICATION_I18N.
  'BPJEPS APT', 'BPJEPS AGFF', 'DEUG / Licence STAPS', 'DEUST MF',
  'CQP IF', 'Diplôme fédéral', 'Personal Trainer NASM', 'Personal Trainer ACE',
  'Nutrition sportive certifiée', 'CrossFit L1 / L2', 'Yoga RYT 200',
]
const SPECIALTY_I18N: Record<string, string> = {
  'Force & Powerlifting': 'strengthPowerlifting',
  Hypertrophie: 'hypertrophy',
  'Perte de poids': 'weightLoss',
  'Cardio & Endurance': 'cardioEndurance',
  'Nutrition sportive': 'sportsNutrition',
  Réhabilitation: 'rehabilitation',
  CrossFit: 'crossfit',
  'Course à pied': 'running',
  'Yoga & Souplesse': 'yogaFlexibility',
  'Boxe & Arts martiaux': 'boxingMartialArts',
  Natation: 'swimming',
  'Préparation physique': 'athleticPreparation',
}
const CERTIFICATION_I18N: Record<string, string> = {
  'Diplôme fédéral': 'federalDiploma',
  'Nutrition sportive certifiée': 'certifiedSportsNutrition',
}

type Step = 1 | 2 | 3
type FirebaseAuthError = { code?: string; message?: string }

function firebaseCoachRegisterErrorMessage(error: unknown, t: (key: string) => string) {
  const code = (error as FirebaseAuthError | null)?.code
  if (code === 'auth/email-already-in-use') return t('auth.register.errors.emailExists')
  if (code === 'auth/weak-password') return t('auth.register.errors.weakPassword')
  if (code === 'auth/invalid-email') return t('auth.register.errors.invalidEmail')
  if (code === 'auth/operation-not-allowed') return t('auth.register.errors.emailNotEnabled')
  return t('auth.register.coach.errors.generic')
}

function coachChoiceLabel(t: (key: string) => string, namespace: string, map: Record<string, string>, value: string) {
  const key = map[value]
  return key ? t(`${namespace}.${key}`) : value
}

function coachChoiceSummary(t: (key: string) => string, namespace: string, map: Record<string, string>, values: string[]) {
  if (values.length === 0) return '—'
  return values.map((value) => coachChoiceLabel(t, namespace, map, value)).join(', ')
}

// Small registration switch for information the coach can expose to members.
function VisibilityToggle({ checked, onChange, label }: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-left"
    >
      <span className="text-xs font-medium text-zinc-300">{label}</span>
      <span className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${checked ? 'bg-[#C8F135]' : 'bg-zinc-700'}`}>
        <span className={`size-4 rounded-full bg-black transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </span>
    </button>
  )
}

/** Multi-step coach registration form: collects account credentials, professional profile, and certifications; posts to /api/auth/register/coach. */
export default function CoachRegisterPage() {
  const { t, locale } = useLocale()
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [legalAccepted, setLegalAccepted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const authMode = publicAuthProviderMode()
  const showFirebase = canUseFirebaseAuth(authMode)
  const showNextAuth = canUseNextAuth(authMode)
  const useFirebaseEmail = showFirebase && !showNextAuth

  const [form, setForm] = useState({
    name:            '',
    email:           '',
    password:        '',
    bio:             '',
    specialties:     [] as string[],
    certifications:  [] as string[],
    yearsExperience: '',
    city:            '',
    phone:           '',
    memberLimit:     '10',
    showMemberCount: true,
    showYearsExperience: true,
    publicRating:    '',
    publicRatingCount: '0',
    showPublicRating: false,
    discoveryCallEnabled: true,
    discoveryCallTitle: t('coachSettings.discovery.defaultTitle'),
    discoveryCallDuration: '30',
    showDiscoveryCall: true,
  })

  const set = (key: string, value: unknown) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  const toggleSpecialty = (s: string) => {
    const current = form.specialties
    if (current.includes(s)) {
      set('specialties', current.filter((x) => x !== s))
    } else if (current.length < 5) {
      set('specialties', [...current, s])
    }
  }

  const toggleCertification = (c: string) => {
    const current = form.certifications
    set('certifications', current.includes(c) ? current.filter((x) => x !== c) : [...current, c])
  }

  const validateStep1 = () => {
    const errs: Record<string, string> = {}
    if (!form.name.trim() || form.name.length < 2) errs.name = t('auth.register.coach.errors.nameMin')
    if (!form.email.includes('@')) errs.email = t('auth.register.errors.invalidEmail')
    if (form.password.length < 8) errs.password = t('auth.register.coach.errors.passwordMin')
    if (!legalAccepted) errs.legal = t('legalConsent.account.error')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateStep2 = () => {
    const errs: Record<string, string> = {}
    if (form.bio.trim().length < 20) errs.bio = t('auth.register.coach.errors.bioMin')
    if (form.specialties.length === 0) errs.specialties = t('auth.register.coach.errors.specialtyRequired')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleFirebaseCoachRegister = async () => {
    if (!validateStep1()) return
    setLoading(true)
    try {
      const credential = await firebaseEmailRegister(
        form.email.trim().toLowerCase(),
        form.password,
        form.name,
      )
      toast.success(t('auth.register.coach.firebaseCreated'))
      await signInBodyOpsWithFirebaseCredential(credential, '/auth/coach/complete', legalAcceptanceForLocale(locale))
    } catch (err) {
      setErrors({ email: firebaseCoachRegisterErrorMessage(err, t) })
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep2()) return
    setLoading(true)

    const res = await fetch('/api/auth/register/coach', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        ...form,
        yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : undefined,
        memberLimit:     Number(form.memberLimit) || 10,
        publicRating:    form.publicRating ? Number(form.publicRating) : null,
        publicRatingCount: Number(form.publicRatingCount) || 0,
        discoveryCallDuration: Number(form.discoveryCallDuration) || 30,
        legalAcceptance: legalAcceptanceForLocale(locale),
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      const fieldErrors: Record<string, string> = {}
      if (data.error && typeof data.error === 'object') {
        Object.entries(data.error).forEach(([k, v]) => {
          fieldErrors[k] = (v as string[])[0]
        })
      }
      setErrors(fieldErrors)
      if (fieldErrors.email) setStep(1)
      setLoading(false)
      return
    }

    const result = await signIn('credentials', {
      email:    form.email,
      password: form.password,
      redirect: false,
    })

    if (result?.ok) {
      toast.success(t('auth.register.coach.created'))
      router.push('/coach/dashboard')
    } else {
      toast.error(t('auth.register.member.manualSignin'))
      router.push('/auth/signin')
    }
  }

  return (
    <div className="relative min-h-screen text-white flex items-center justify-center px-4 py-12">
      <PageBackground showArtwork={false} />
      <div className="relative z-10 w-full max-w-lg">

        <div className="text-center mb-8">
          <div className="mb-6 flex justify-center">
            <Logo href="/" size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t('auth.register.coach.title')}</h1>
          <p className="text-sm text-zinc-400 mt-1">{t('auth.register.coach.step')} {step} {t('auth.register.coach.stepTotal')}</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {([1, 2, 3] as const).map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-[#C8F135]' : 'bg-zinc-800'}`} />
          ))}
        </div>

        {/* Step 1: credentials */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white">{t('auth.register.coach.connectionInfo')}</h2>

            <LegalConsentCheckbox
              checked={legalAccepted}
              onChange={(checked) => {
                setLegalAccepted(checked)
                setErrors((e) => ({ ...e, legal: '' }))
              }}
              error={errors.legal}
            />

            {showFirebase && (
              <div className="space-y-2">
                <SocialAuthButtons
                  callbackUrl="/auth/coach/complete"
                  disabled={loading || !legalAccepted}
                  legalAcceptance={legalAccepted ? legalAcceptanceForLocale(locale) : undefined}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('auth.register.fullName')}</label>
              <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
                placeholder={t('auth.register.coach.namePlaceholder')}
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm" />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('auth.register.coach.professionalEmail')}</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                placeholder={t('auth.register.coach.emailPlaceholder')}
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm" />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={(e) => set('password', e.target.value)} placeholder={t('auth.register.passwordPlaceholder')}
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm" />
                <button type="button" onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
            </div>

            {showNextAuth && (
            <button type="button" onClick={() => { if (validateStep1()) setStep(2) }}
              className="w-full py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-semibold text-sm hover:bg-[#d4f54d] transition-colors">
              {t('auth.register.coach.nextStep')}
            </button>
            )}

            {useFirebaseEmail && (
              <button type="button" onClick={handleFirebaseCoachRegister} disabled={loading}
                className="w-full py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-semibold text-sm hover:bg-[#d4f54d] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading
                  ? <span className="size-5 rounded-full border-2 border-zinc-600 border-t-zinc-900 animate-spin" />
                  : t('auth.register.coach.submit')}
              </button>
            )}

            {showFirebase && (
              <p className="text-center text-xs text-zinc-500">{t('auth.register.coach.firebaseHint')}</p>
            )}
          </div>
        )}

        {/* Step 2: coach profile */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-base font-semibold text-white">{t('auth.register.coach.profileTitle')}</h2>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                {t('auth.register.coach.bioPresentation')} <span className="text-zinc-500 font-normal">{t('auth.register.coach.bioMinHint')}</span>
              </label>
              <textarea value={form.bio} onChange={(e) => set('bio', e.target.value)} rows={4}
                placeholder={t('auth.register.coach.bioPlaceholder')}
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm resize-none" />
              <p className="mt-1 text-xs text-zinc-500">{form.bio.length} / 1000 {t('auth.register.coach.characters')}</p>
              {errors.bio && <p className="text-xs text-red-400">{errors.bio}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                {t('coachSettings.specialties')} <span className="text-zinc-500 font-normal">{t('auth.register.coach.specialtiesHint')}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map((s) => {
                  const active = form.specialties.includes(s)
                  return (
                    <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                      disabled={!active && form.specialties.length >= 5}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? 'border-[#C8F135] bg-[#C8F135]/10 text-[#C8F135]'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600 disabled:opacity-40'
                      }`}>
                      {active && <Check className="size-3 inline mr-1" />}
                      {coachChoiceLabel(t, 'auth.register.coach.specialtyOptions', SPECIALTY_I18N, s)}
                    </button>
                  )
                })}
              </div>
              {errors.specialties && <p className="mt-1 text-xs text-red-400">{errors.specialties}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('coachSettings.yearsExperience')}</label>
                <input type="number" min="0" max="50" value={form.yearsExperience}
                  onChange={(e) => set('yearsExperience', e.target.value)} placeholder="5"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('auth.register.coach.maxClients')}</label>
                <input type="number" min="1" max="100" value={form.memberLimit}
                  onChange={(e) => set('memberLimit', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm" />
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="mb-3 text-xs font-medium text-zinc-300">{t('coachSettings.visibility.title')}</p>
              <div className="space-y-2">
                <VisibilityToggle
                  checked={form.showYearsExperience}
                  onChange={(checked) => set('showYearsExperience', checked)}
                  label={t('auth.register.coach.showMyYears')}
                />
                <VisibilityToggle
                  checked={form.showMemberCount}
                  onChange={(checked) => set('showMemberCount', checked)}
                  label={t('auth.register.coach.showMyMemberCount')}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors">
                {t('common.back')}
              </button>
              <button type="button" onClick={() => { if (validateStep2()) setStep(3) }}
                className="flex-1 py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-semibold text-sm hover:bg-[#d4f54d] transition-colors">
                {t('auth.register.coach.nextStep')}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: optional details and submit */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-base font-semibold text-white">{t('auth.register.coach.additionalInfo')}</h2>
            <p className="text-sm text-zinc-400">{t('auth.register.coach.additionalDescription')}</p>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                {t('auth.register.coach.certificationsTitle')}
              </label>
              <div className="flex flex-wrap gap-2">
                {CERTIFICATIONS.map((c) => {
                  const active = form.certifications.includes(c)
                  return (
                    <button key={c} type="button" onClick={() => toggleCertification(c)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? 'border-[#C8F135] bg-[#C8F135]/10 text-[#C8F135]'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                      }`}>
                      {active && <Check className="size-3 inline mr-1" />}
                      {coachChoiceLabel(t, 'auth.register.coach.certificationOptions', CERTIFICATION_I18N, c)}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('coachSettings.city')}</label>
                <input type="text" value={form.city} onChange={(e) => set('city', e.target.value)}
                  placeholder={t('coachSettings.cityPlaceholder')}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('coachSettings.phone')}</label>
                <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)}
                  placeholder="+33 6 00 00 00 00"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm" />
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="mb-3 text-xs font-medium text-zinc-300">{t('coachSettings.publicRating.title')}</p>
              <VisibilityToggle
                checked={form.showPublicRating}
                onChange={(checked) => set('showPublicRating', checked)}
                label={t('auth.register.coach.showRating')}
              />
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('auth.register.coach.rating')}</label>
                  <input type="number" min="0" max="5" step="0.1" value={form.publicRating}
                    onChange={(e) => set('publicRating', e.target.value)} placeholder="4.8"
                    className="w-full min-w-0 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm" />
                </div>
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('auth.register.coach.reviews')}</label>
                  <input type="number" min="0" value={form.publicRatingCount}
                    onChange={(e) => set('publicRatingCount', e.target.value)}
                    className="w-full min-w-0 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="mb-3 text-xs font-medium text-zinc-300">{t('coachSettings.discovery.title')}</p>
              <div className="space-y-2">
                <VisibilityToggle
                  checked={form.discoveryCallEnabled}
                  onChange={(checked) => set('discoveryCallEnabled', checked)}
                  label={t('coachSettings.discovery.enable')}
                />
                <VisibilityToggle
                  checked={form.showDiscoveryCall}
                  onChange={(checked) => set('showDiscoveryCall', checked)}
                  label={t('auth.register.coach.showDiscovery')}
                />
              </div>
              <div className="mt-3 grid grid-cols-[1fr_96px] gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('coachSettings.displayName')}</label>
                  <input type="text" value={form.discoveryCallTitle}
                    onChange={(e) => set('discoveryCallTitle', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('auth.register.coach.minutes')}</label>
                  <input type="number" min="5" max="180" value={form.discoveryCallDuration}
                    onChange={(e) => set('discoveryCallDuration', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-400">
              <p className="font-medium text-zinc-300 mb-1">{t('auth.register.coach.summary')}</p>
              <ul className="space-y-1">
                <li>{t('auth.register.coach.nameSummary')}: <span className="text-white">{form.name}</span></li>
                <li>{t('auth.email')} : <span className="text-white">{form.email}</span></li>
                <li>{t('coachSettings.specialties')}: <span className="text-white">{coachChoiceSummary(t, 'auth.register.coach.specialtyOptions', SPECIALTY_I18N, form.specialties)}</span></li>
                <li>{t('auth.register.coach.experienceSummary')}: <span className="text-white">{form.yearsExperience ? `${form.yearsExperience} ${t('auth.register.coach.years')}` : '—'}</span></li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors">
                {t('common.back')}
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-semibold text-sm hover:bg-[#d4f54d] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading
                  ? <span className="size-5 rounded-full border-2 border-zinc-600 border-t-zinc-900 animate-spin" />
                  : t('auth.register.coach.submit')}
              </button>
            </div>
          </form>
        )}

        <div className="flex items-center justify-between mt-6">
          <Link href="/auth/register" className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            <ChevronLeft className="size-3" /> {t('auth.register.coach.changeProfile')}
          </Link>
          <Link href="/auth/signin" className="text-xs text-zinc-400 hover:text-[#C8F135] transition-colors">
            {t('auth.register.alreadyAccount')}
          </Link>
        </div>
      </div>
    </div>
  )
}
