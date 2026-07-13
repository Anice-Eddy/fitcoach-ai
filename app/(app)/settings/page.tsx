'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { useSession }           from 'next-auth/react'
import Link from 'next/link'
import { useUserStore }         from '@/stores/userStore'
import { PageWrapper }          from '@/components/layout/PageWrapper'
import { Header }               from '@/components/layout/Header'
import { toast }                from 'sonner'
import { kgToLb, lbToKg, cmToFtIn, ftInToCm } from '@/utils/unit-conversions'
import { Home, Dumbbell, Building2, TreePine, LogOut, Trash2, Save, User, Sparkles, ArrowRight, Scale, Target, CalendarDays, Plus, X, AlertTriangle, Flame, Activity, Leaf } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { InjuryEntry } from '@/utils/validators'
import { DeleteAccountModal } from '@/components/ui/DeleteAccountModal'
import { useMyCoach } from '@/lib/coach/use-my-coach'
import { signOutAndClear } from '@/lib/auth/client-session'
import { useLocale } from '@/contexts/LocaleContext'
import { GOAL_LABEL_KEYS } from '@/lib/i18n/profile-label-keys'

// Shared settings constants that mirror onboarding steps; stored values stay stable while labels are localized at render time.

const TRAINING_PLACES = [
  { id: 'home_bw',   icon: Home,      equipment: ['BODYWEIGHT'] },
  { id: 'home_gear', icon: Dumbbell,  equipment: ['BODYWEIGHT', 'DUMBBELL', 'KETTLEBELL', 'RESISTANCE_BAND', 'PULL_UP_BAR'] },
  { id: 'gym',       icon: Building2, equipment: ['BARBELL', 'DUMBBELL', 'KETTLEBELL', 'BENCH', 'CABLE_MACHINE', 'SMITH_MACHINE', 'CARDIO_MACHINE', 'PULL_UP_BAR', 'BODYWEIGHT'] },
  { id: 'outdoor',   icon: TreePine,  equipment: ['BODYWEIGHT', 'PULL_UP_BAR', 'RESISTANCE_BAND'] },
]

const ACTIVITY_OPTIONS = [
  { value: 'SEDENTARY' },
  { value: 'LIGHTLY_ACTIVE' },
  { value: 'MODERATELY_ACTIVE' },
  { value: 'VERY_ACTIVE' },
  { value: 'EXTREMELY_ACTIVE' },
]

const GOAL_OPTIONS: { value: string; icon: LucideIcon }[] = [
  { value: 'WEIGHT_LOSS',     icon: Flame },
  { value: 'MUSCLE_GAIN',     icon: Dumbbell },
  { value: 'MAINTENANCE',     icon: Scale },
  { value: 'ENDURANCE',       icon: Activity },
  { value: 'GENERAL_FITNESS', icon: Target },
  { value: 'FLEXIBILITY',     icon: Leaf },
]

const LEVEL_OPTIONS = [
  { value: 'BEGINNER' },
  { value: 'INTERMEDIATE' },
  { value: 'ADVANCED' },
  { value: 'ATHLETE' },
]

const GENDER_OPTIONS = [
  { value: 'MALE' },
  { value: 'FEMALE' },
]

// These values are persisted in existing profiles; translate only their display labels through the *_I18N maps.
const RESTRICTIONS = ['Végétarien', 'Végan', 'Sans gluten', 'Sans lactose', 'Halal', 'Casher', 'Sans noix', 'Sans porc']
const PREFERENCES  = ['Viande blanche', 'Poisson', 'Œufs', 'Légumineuses', 'Riz', 'Pâtes', 'Pommes de terre', 'Légumes verts', 'Fruits', 'Produits laitiers']
const RESTRICTION_I18N: Record<string, string> = {
  Végétarien:    'vegetarian',
  Végan:         'vegan',
  'Sans gluten': 'glutenFree',
  'Sans lactose': 'lactoseFree',
  Halal:         'halal',
  Casher:        'kosher',
  'Sans noix':   'nutFree',
  'Sans porc':   'porkFree',
}
const PREFERENCE_I18N: Record<string, string> = {
  'Viande blanche':   'whiteMeat',
  Poisson:            'fish',
  Œufs:               'eggs',
  Légumineuses:       'legumes',
  Riz:                'rice',
  Pâtes:              'pasta',
  'Pommes de terre':  'potatoes',
  'Légumes verts':    'greenVegetables',
  Fruits:             'fruits',
  'Produits laitiers': 'dairy',
}

// Injury body-part values are also stored as user data, so keep them stable and localize labels at render time.
const BODY_PARTS = [
  'Cou / Nuque', 'Épaule gauche', 'Épaule droite', 'Coude gauche', 'Coude droit',
  'Poignet gauche', 'Poignet droit', 'Dos haut', 'Dos bas / Lombaires',
  'Hanche gauche', 'Hanche droite', 'Genou gauche', 'Genou droit',
  'Cheville gauche', 'Cheville droite', 'Quadriceps gauche', 'Quadriceps droit',
  'Ischio-jambiers gauche', 'Ischio-jambiers droit', 'Mollet gauche', 'Mollet droit',
]
const BODY_PART_I18N: Record<string, string> = {
  'Cou / Nuque':                 'neck',
  'Épaule gauche':               'leftShoulder',
  'Épaule droite':               'rightShoulder',
  'Coude gauche':                'leftElbow',
  'Coude droit':                 'rightElbow',
  'Poignet gauche':              'leftWrist',
  'Poignet droit':               'rightWrist',
  'Dos haut':                    'upperBack',
  'Dos bas / Lombaires':         'lowerBack',
  'Hanche gauche':               'leftHip',
  'Hanche droite':               'rightHip',
  'Genou gauche':                'leftKnee',
  'Genou droit':                 'rightKnee',
  'Cheville gauche':             'leftAnkle',
  'Cheville droite':             'rightAnkle',
  'Quadriceps gauche':           'leftQuadriceps',
  'Quadriceps droit':            'rightQuadriceps',
  'Ischio-jambiers gauche':      'leftHamstring',
  'Ischio-jambiers droit':       'rightHamstring',
  'Mollet gauche':               'leftCalf',
  'Mollet droit':                'rightCalf',
}
const SEVERITY_LABELS: Record<string, { color: string }> = {
  MILD:     { color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  MODERATE: { color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
  SEVERE:   { color: 'text-red-400 bg-red-400/10 border-red-400/20' },
}
const PLACE_I18N: Record<string, string> = {
  home_bw:   'homeBodyweight',
  home_gear: 'homeGear',
  gym:       'gym',
  outdoor:   'outdoor',
}
const ACTIVITY_I18N: Record<string, string> = {
  SEDENTARY:         'sedentary',
  LIGHTLY_ACTIVE:    'light',
  MODERATELY_ACTIVE: 'moderate',
  VERY_ACTIVE:       'very',
  EXTREMELY_ACTIVE:  'extreme',
}
const GOAL_I18N: Record<string, string> = {
  WEIGHT_LOSS:     'weightLoss',
  MUSCLE_GAIN:     'muscleGain',
  MAINTENANCE:     'maintenance',
  ENDURANCE:       'endurance',
  GENERAL_FITNESS: 'generalFitness',
  FLEXIBILITY:     'flexibility',
}
const LEVEL_I18N: Record<string, string> = {
  BEGINNER:     'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED:     'advanced',
  ATHLETE:      'athlete',
}

function bodyPartLabel(t: (key: string) => string, value: string) {
  const key = BODY_PART_I18N[value]
  return key ? t(`onboarding.health.bodyParts.${key}`) : value
}

function profileGoalLabel(t: (key: string) => string, value?: string | null) {
  if (!value) return null
  const key = GOAL_LABEL_KEYS[value]
  return key ? t(key) : value
}

function placeIdsFromEquipment(eq?: string[]): string[] {
  if (!eq?.length) return []
  const ids: string[] = []
  if (eq.includes('BARBELL')) ids.push('gym')
  if (eq.includes('DUMBBELL') && !eq.includes('BARBELL')) ids.push('home_gear')
  if (eq.includes('RESISTANCE_BAND') && !eq.includes('DUMBBELL') && !eq.includes('BARBELL')) ids.push('outdoor')
  if (eq.length === 1 && eq[0] === 'BODYWEIGHT') ids.push('home_bw')
  return ids
}

// Card section wrapper with a header title and padded content area.
function Section({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-300">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </section>
  )
}


/** Member settings hub: profile info, physical measurements, training preferences, equipment, and plan/subscription section. */
export default function SettingsPage() {
  const { locale, t } = useLocale()
  const { data: session }       = useSession()
  const { profile, setProfile } = useUserStore()
  const { hasCoach, coachName, nextAppointment, loading: coachLoading } = useMyCoach()

  const [saving,  setSaving]  = useState(false)
  const [showDel, setShowDel] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Units
  const [weightUnit, setWeightUnit] = useState<'KG' | 'LB'>(profile?.weightUnit ?? 'KG')
  const [heightUnit, setHeightUnit] = useState<'CM' | 'FT_IN'>(profile?.heightUnit ?? 'CM')

  // Personal info
  const [firstName, setFirstName] = useState(profile?.firstName ?? '')
  const [age,       setAge]       = useState(String(profile?.age ?? ''))
  const [gender,    setGender]    = useState(profile?.gender ?? '')

  // Measurements are always stored in kg/cm internally.
  const [weightKg, setWeightKg] = useState(String(profile?.weightKg ?? ''))
  const [heightCm, setHeightCm] = useState(String(profile?.heightCm ?? ''))
  const [waistCm,  setWaistCm]  = useState(String(profile?.waistCm  ?? ''))
  const [hipsCm,   setHipsCm]   = useState(String(profile?.hipsCm   ?? ''))

  // display values for LB / FT_IN
  const [lbDisplay, setLbDisplay] = useState(() => profile?.weightKg ? String(kgToLb(profile.weightKg)) : '')
  const [ftDisplay, setFtDisplay] = useState<{ feet: string; inches: string }>(() => {
    if (!profile?.heightCm) return { feet: '', inches: '' }
    const { feet, inches } = cmToFtIn(profile.heightCm)
    return { feet: String(feet), inches: String(inches) }
  })

  // Activity
  const [placeIds,     setPlaceIds]     = useState<string[]>(() => placeIdsFromEquipment(profile?.availableEquipment as string[]))
  const [activityLevel, setActivityLevel] = useState(profile?.activityLevel ?? '')
  // Injuries
  const [injuries,     setInjuries]     = useState<InjuryEntry[]>(() => {
    const raw = (profile as Record<string, unknown> | null)?.injuries
    return Array.isArray(raw) ? (raw as InjuryEntry[]) : []
  })
  const [injuryForm,   setInjuryForm]   = useState<{ bodyPart: string; severity: InjuryEntry['severity']; description: string }>({ bodyPart: BODY_PARTS[0], severity: 'MILD', description: '' })
  const [trainingDays,  setTrainingDays]  = useState(profile?.trainingDaysPerWeek ?? 3)

  // Goals
  const [fitnessGoal,   setFitnessGoal]   = useState(profile?.fitnessGoal ?? '')
  const [targetWeight,  setTargetWeight]  = useState(String(profile?.targetWeightKg ?? ''))
  const [fitnessLevel,  setFitnessLevel]  = useState(profile?.fitnessLevel ?? '')

  // Diet
  const [restrictions, setRestrictions] = useState<string[]>(profile?.dietaryRestrictions ?? [])
  const [foodPrefs,    setFoodPrefs]    = useState<string[]>(profile?.foodPreferences ?? [])

  // Fetch fresh profile from API on mount
  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return
        setProfile(data)
        setWeightUnit(data.weightUnit ?? 'KG')
        setHeightUnit(data.heightUnit ?? 'CM')
        setFirstName(data.firstName ?? '')
        setAge(String(data.age ?? ''))
        setGender(data.gender ?? '')
        setWeightKg(String(data.weightKg ?? ''))
        setHeightCm(String(data.heightCm ?? ''))
        setWaistCm(String(data.waistCm ?? ''))
        setHipsCm(String(data.hipsCm ?? ''))
        if (data.weightKg) setLbDisplay(String(kgToLb(data.weightKg)))
        if (data.heightCm) {
          const { feet, inches } = cmToFtIn(data.heightCm)
          setFtDisplay({ feet: String(feet), inches: String(inches) })
        }
        setPlaceIds(placeIdsFromEquipment(data.availableEquipment))
        const rawInjuries = (data as Record<string, unknown>).injuries
        setInjuries(Array.isArray(rawInjuries) ? (rawInjuries as InjuryEntry[]) : [])
        setActivityLevel(data.activityLevel ?? '')
        setTrainingDays(data.trainingDaysPerWeek ?? 3)
        setFitnessGoal(data.fitnessGoal ?? '')
        setTargetWeight(String(data.targetWeightKg ?? ''))
        setFitnessLevel(data.fitnessLevel ?? '')
        setRestrictions(data.dietaryRestrictions ?? [])
        setFoodPrefs(data.foodPreferences ?? [])
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleList = useCallback((
    list: string[],
    setter: (v: string[]) => void,
    val: string,
  ) => {
    setter(list.includes(val) ? list.filter((v) => v !== val) : [...list, val])
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const unionEquipment = Array.from(new Set(
        TRAINING_PLACES.filter(p => placeIds.includes(p.id)).flatMap(p => p.equipment)
      ))
      const body: Record<string, unknown> = {
        weightUnit,
        heightUnit,
        dietaryRestrictions: restrictions,
        foodPreferences:     foodPrefs,
        trainingDaysPerWeek: trainingDays,
        injuries,
      }
      if (firstName)                body.firstName           = firstName
      if (age)                      body.age                 = parseInt(age)
      if (gender)                   body.gender              = gender
      if (weightKg)                 body.weightKg            = parseFloat(weightKg)
      if (heightCm)                 body.heightCm            = parseFloat(heightCm)
      if (waistCm)                  body.waistCm             = parseFloat(waistCm)
      if (hipsCm)                   body.hipsCm              = parseFloat(hipsCm)
      if (activityLevel)            body.activityLevel       = activityLevel
      if (unionEquipment.length)    body.availableEquipment  = unionEquipment
      if (fitnessGoal)              body.fitnessGoal         = fitnessGoal
      if (fitnessLevel)             body.fitnessLevel        = fitnessLevel
      if (targetWeight)             body.targetWeightKg      = parseFloat(targetWeight)

      const res = await fetch('/api/user/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setProfile(updated)
      toast.success(t('settings.profileUpdated'))
    } catch {
      toast.error(t('settings.profileSaveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async (password?: string) => {
    setDeleting(true)
    try {
      const res = await fetch('/api/user/account', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? t('settings.deleteError'))
      }
      await signOutAndClear('/')
    } catch (e) {
      setDeleting(false)
      throw e
    }
  }

  // Render

  return (
    <>
      <Header titleKey="settings.title" />
      <PageWrapper>
        {showDel && (
          <DeleteAccountModal
            onConfirm={handleDeleteAccount}
            onCancel={() => setShowDel(false)}
            deleting={deleting}
          />
        )}

        <div className="mx-auto w-full max-w-7xl space-y-6 pb-10">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C8F135]">{t('settings.personalSpace')}</p>
            <h1 className="mt-1 text-3xl font-bold text-white">{t('settings.title')}</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              {t('settings.settingsDescription')}
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C8F135] px-4 py-3 text-sm font-bold text-zinc-900 transition-colors hover:bg-[#d4f54d] disabled:opacity-60 sm:w-auto"
          >
            <Save className="size-4" />
            {saving ? t('settings.saving') : t('common.save')}
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] lg:items-start">
          <aside className="space-y-6 lg:sticky lg:top-6">
            {/* Compte */}
            <section className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800">
                <h2 className="text-sm font-semibold text-zinc-300">{t('settings.account')}</h2>
              </div>
              <div className="p-5 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 ring-1 ring-zinc-700">
                    {session?.user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={session.user.image} alt="" className="size-14 rounded-full object-cover" />
                    ) : (
                      <User className="size-7 text-zinc-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-white">{session?.user?.name ?? profile?.firstName ?? t('settings.userFallback')}</div>
                    <div className="truncate text-sm text-zinc-400">{session?.user?.email ?? '—'}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                    <Scale className="mb-2 size-4 text-[#C8F135]" />
                    <p className="text-[11px] text-zinc-500">{t('settings.weightShort')}</p>
                    <p className="truncate text-sm font-semibold text-white">{profile?.weightKg ? `${profile.weightKg} kg` : '—'}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                    <Target className="mb-2 size-4 text-[#C8F135]" />
                    <p className="text-[11px] text-zinc-500">{t('settings.objective')}</p>
                    <p className="truncate text-sm font-semibold text-white">{profile?.targetWeightKg ? `${profile.targetWeightKg} kg` : '—'}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                    <CalendarDays className="mb-2 size-4 text-[#C8F135]" />
                    <p className="text-[11px] text-zinc-500">{t('settings.weekShort')}</p>
                    <p className="truncate text-sm font-semibold text-white">{profile?.trainingDaysPerWeek ?? trainingDays} {t('settings.dayShort')}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Mon accompagnement */}
            <section className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-300">{t('settings.myCoaching')}</h2>
                <span className="rounded-full bg-[#C8F135]/10 px-2.5 py-1 text-xs font-medium text-[#C8F135]">
                    {hasCoach ? t('settings.realCoach') : t('settings.ai')}
                </span>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#C8F135]/10">
                    <Sparkles className="size-5 text-[#C8F135]" />
                  </div>
                  <div>
                    {hasCoach ? (
                      <>
                        <p className="text-sm font-medium text-white">{coachLoading ? t('settings.syncing') : coachName ?? t('settings.coachToConfirm')}</p>
                        <p className="text-xs text-zinc-500">
                          {t('settings.nextAppointment')} : {nextAppointment ? new Date(nextAppointment.scheduledAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : t('settings.toPlan').toLowerCase()}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-white">{t('settings.programAiActive')}</p>
                        <p className="text-xs text-zinc-500">{profileGoalLabel(t, profile?.fitnessGoal) ?? t('settings.goalToFinalize')}</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <Link
                    href="/choose?returnTo=/settings"
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#C8F135] px-4 py-2.5 text-sm font-bold text-zinc-900 transition-colors hover:bg-[#d4f54d]"
                  >
                    {t('settings.changeMode')} <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    href={hasCoach ? '/choose?returnTo=/settings' : '/coaches?returnTo=/settings'}
                    className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                  >
                    {hasCoach ? t('settings.changeCoach') : t('settings.switchToRealCoach')}
                  </Link>
                </div>
              </div>
            </section>
          </aside>

          <div className="grid min-w-0 gap-6 xl:grid-cols-2">

        {/* Units */}
        <Section title={t('settings.measurementUnits')}>
          <div>
            <p className="text-xs text-zinc-500 mb-2">{t('settings.weight')}</p>
            <div className="grid grid-cols-2 gap-3">
              {(['KG', 'LB'] as const).map((u) => (
                <button key={u} type="button" onClick={() => setWeightUnit(u)}
                  className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                    weightUnit === u ? 'border-[#C8F135] bg-[#C8F135]/10 text-[#C8F135]' : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                  }`}
                >
                  {u === 'KG' ? t('settings.kilograms') : t('settings.pounds')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-2">{t('settings.height')}</p>
            <div className="grid grid-cols-2 gap-3">
              {(['CM', 'FT_IN'] as const).map((u) => (
                <button key={u} type="button" onClick={() => setHeightUnit(u)}
                  className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                    heightUnit === u ? 'border-[#C8F135] bg-[#C8F135]/10 text-[#C8F135]' : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                  }`}
                >
                  {u === 'CM' ? t('settings.centimeters') : t('settings.feetInches')}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Informations personnelles */}
        <Section title={t('settings.myProfile')}>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">{t('settings.firstName')}</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)}
              placeholder={t('onboarding.identity.firstNamePlaceholder')}
              className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">{t('settings.age')}</label>
            <input value={age} onChange={(e) => setAge(e.target.value)}
              type="number" min={13} max={100} placeholder="25"
              className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-2">{t('settings.gender')}</label>
            <div className="grid grid-cols-3 gap-3">
              {GENDER_OPTIONS.map((opt) => (
                <button key={opt.value} type="button"
                  onClick={() => setGender(gender === opt.value ? '' : opt.value)}
                  className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                    gender === opt.value ? 'border-[#C8F135] bg-[#C8F135]/10 text-[#C8F135]' : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                  }`}
                >
                  {opt.value === 'MALE' ? t('onboarding.identity.male') : t('onboarding.identity.female')}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Mensurations */}
        <Section title={t('settings.bodyInfo')}>
          {/* Weight */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-zinc-500">{t('settings.weight')}</label>
              <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded">
                {weightUnit === 'KG' ? 'kg' : 'lb'}
              </span>
            </div>
            {weightUnit === 'KG' ? (
              <input value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                type="number" step="0.1" placeholder="70"
                className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#C8F135] transition-colors"
              />
            ) : (
              <input value={lbDisplay}
                onChange={(e) => {
                  setLbDisplay(e.target.value)
                  const lb = parseFloat(e.target.value)
                  if (!isNaN(lb)) setWeightKg(String(lbToKg(lb)))
                }}
                type="number" step="0.1" placeholder="154"
                className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#C8F135] transition-colors"
              />
            )}
          </div>

          {/* Height */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-zinc-500">{t('settings.height')}</label>
              <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded">
                {heightUnit === 'CM' ? 'cm' : 'ft / in'}
              </span>
            </div>
            {heightUnit === 'CM' ? (
              <input value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                type="number" placeholder={t('settings.placeholders.heightCm')}
                className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#C8F135] transition-colors"
              />
            ) : (
              <div className="flex gap-3">
                <div className="flex-1">
                  <input value={ftDisplay.feet}
                    onChange={(e) => {
                      const f = { ...ftDisplay, feet: e.target.value }
                      setFtDisplay(f)
                      setHeightCm(String(ftInToCm(parseFloat(f.feet) || 0, parseFloat(f.inches) || 0)))
                    }}
                    type="number" placeholder={t('settings.placeholders.feet')}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#C8F135] transition-colors"
                  />
                  <p className="text-xs text-zinc-500 mt-1 text-center">{t('onboarding.measurements.feet')}</p>
                </div>
                <div className="flex-1">
                  <input value={ftDisplay.inches}
                    onChange={(e) => {
                      const f = { ...ftDisplay, inches: e.target.value }
                      setFtDisplay(f)
                      setHeightCm(String(ftInToCm(parseFloat(f.feet) || 0, parseFloat(f.inches) || 0)))
                    }}
                    type="number" placeholder={t('settings.placeholders.inches')}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#C8F135] transition-colors"
                  />
                  <p className="text-xs text-zinc-500 mt-1 text-center">{t('onboarding.measurements.inches')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Waist and hips */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">
                {t('settings.waist')} <span className="text-zinc-600">{t('settings.optional')}</span>
              </label>
              <input value={waistCm} onChange={(e) => setWaistCm(e.target.value)}
                type="number" placeholder={t('settings.placeholders.waistCm')}
                className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#C8F135] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">
                {t('settings.hips')} <span className="text-zinc-600">{t('settings.optional')}</span>
              </label>
              <input value={hipsCm} onChange={(e) => setHipsCm(e.target.value)}
                type="number" placeholder={t('settings.placeholders.hipsCm')}
                className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#C8F135] transition-colors"
              />
            </div>
          </div>
        </Section>

        {/* Training */}
        <Section title={t('settings.training')} className="xl:col-span-2">
          <div>
            <p className="text-xs text-zinc-500 mb-2">{t('onboarding.activityStep.trainingPlace')}</p>
            <div className="grid grid-cols-2 gap-3">
              {TRAINING_PLACES.map((place) => {
                const Icon   = place.icon
                const active = placeIds.includes(place.id)
                return (
                  <button key={place.id} type="button"
                    onClick={() => setPlaceIds(prev => prev.includes(place.id) ? prev.filter(id => id !== place.id) : [...prev, place.id])}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      active ? 'border-[#C8F135] bg-[#C8F135]/10' : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`size-5 ${active ? 'text-[#C8F135]' : 'text-zinc-400'}`} />
                      <div className={`size-4 rounded border-2 flex items-center justify-center ${active ? 'border-[#C8F135] bg-[#C8F135]' : 'border-zinc-600'}`}>
                        {active && <svg className="size-2.5 text-zinc-950" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                    </div>
                    <p className={`text-sm font-semibold ${active ? 'text-[#C8F135]' : 'text-white'}`}>{t(`onboarding.activityStep.places.${PLACE_I18N[place.id]}.label`)}</p>
                    <p className="text-xs text-zinc-400 mt-0.5 leading-snug">{t(`onboarding.activityStep.places.${PLACE_I18N[place.id]}.description`)}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-xs text-zinc-500 mb-2">{t('onboarding.activityStep.activityLevel')}</p>
            <div className="space-y-2">
              {ACTIVITY_OPTIONS.map((opt) => (
                <button key={opt.value} type="button"
                  onClick={() => setActivityLevel(activityLevel === opt.value ? '' : opt.value)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                    activityLevel === opt.value ? 'border-[#C8F135] bg-[#C8F135]/10' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <div className={`size-4 mt-0.5 rounded-full border-2 shrink-0 transition-colors ${
                    activityLevel === opt.value ? 'border-[#C8F135] bg-[#C8F135]' : 'border-zinc-600'
                  }`} />
                  <div>
                    <p className={`text-sm font-medium ${activityLevel === opt.value ? 'text-[#C8F135]' : 'text-white'}`}>{t(`onboarding.activityStep.levels.${ACTIVITY_I18N[opt.value]}.label`)}</p>
                    <p className="text-xs text-zinc-400">{t(`onboarding.activityStep.levels.${ACTIVITY_I18N[opt.value]}.description`)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-zinc-500 mb-2">
              {t('onboarding.activityStep.trainingDays')}{' '}
              <span className="text-[#C8F135] font-bold">{trainingDays} {trainingDays > 1 ? t('onboarding.activityStep.days') : t('onboarding.activityStep.day')}</span>
            </p>
            <input type="range" min={1} max={7} value={trainingDays}
              onChange={(e) => setTrainingDays(Number(e.target.value))}
              className="w-full accent-[#C8F135] cursor-pointer"
            />
            <div className="flex justify-between text-xs text-zinc-500 mt-1.5 px-0.5">
              {[1,2,3,4,5,6,7].map((d) => (
                <span key={d} className={d === trainingDays ? 'text-[#C8F135] font-bold' : ''}>{d}</span>
              ))}
            </div>
          </div>
        </Section>

        {/* Health & injuries */}
        <Section title={t('settings.healthInjuries')} className="xl:col-span-2">
          {injuries.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-1">
              {injuries.map((inj, i) => {
                const sev = SEVERITY_LABELS[inj.severity]
                return (
                  <div key={i} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${sev.color}`}>
                    <AlertTriangle className="size-3 shrink-0" />
                    <span className="font-semibold">{bodyPartLabel(t, inj.bodyPart)}</span>
                    <span className="opacity-70">— {t(`onboarding.health.severityLabels.${inj.severity.toLowerCase()}`)}</span>
                    {inj.description && <span className="opacity-60 italic">· {inj.description}</span>}
                    <button onClick={() => setInjuries(prev => prev.filter((_, j) => j !== i))} className="ml-1 opacity-60 hover:opacity-100 hover:text-red-400">
                      <X className="size-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/40 p-4 space-y-3">
            <p className="text-xs font-medium text-zinc-400">{t('settings.addInjury')}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] text-zinc-500 mb-1">{t('settings.bodyArea')}</label>
                <select value={injuryForm.bodyPart} onChange={e => setInjuryForm(f => ({ ...f, bodyPart: e.target.value }))}
                  className="w-full px-2.5 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#C8F135]">
                  {BODY_PARTS.map(bp => <option key={bp} value={bp}>{bodyPartLabel(t, bp)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-zinc-500 mb-1">{t('settings.severity')}</label>
                <select value={injuryForm.severity} onChange={e => setInjuryForm(f => ({ ...f, severity: e.target.value as InjuryEntry['severity'] }))}
                  className="w-full px-2.5 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#C8F135]">
                  <option value="MILD">{t('onboarding.health.severityLabels.mild')}</option>
                  <option value="MODERATE">{t('onboarding.health.severityLabels.moderate')}</option>
                  <option value="SEVERE">{t('onboarding.health.severityLabels.severe')}</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-zinc-500 mb-1">{t('settings.details')} <span className="text-zinc-600">({t('settings.optional')})</span></label>
                <input type="text" value={injuryForm.description} onChange={e => setInjuryForm(f => ({ ...f, description: e.target.value }))}
                  placeholder={t('settings.injuryPlaceholder')}
                  className="w-full px-2.5 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]" />
              </div>
            </div>
            <button type="button"
              onClick={() => {
                setInjuries(prev => [...prev, { bodyPart: injuryForm.bodyPart, severity: injuryForm.severity, description: injuryForm.description }])
                setInjuryForm(f => ({ ...f, description: '' }))
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#C8F135]/10 text-[#C8F135] text-xs font-semibold hover:bg-[#C8F135]/20 transition-colors"
            >
              <Plus className="size-3.5" /> {t('common.add')}
            </button>
          </div>
          {injuries.length === 0 && (
            <p className="text-xs text-zinc-600">{t('settings.noInjuryDescription')}</p>
          )}
        </Section>

        {/* Goals */}
        <Section title={t('settings.goals')}>
          <div>
            <p className="text-xs text-zinc-500 mb-2">{t('progress.primaryGoal')}</p>
            <div className="grid grid-cols-2 gap-2">
              {GOAL_OPTIONS.map((opt) => {
                const Icon     = opt.icon
                const isActive = fitnessGoal === opt.value
                return (
                  <button key={opt.value} type="button"
                    onClick={() => setFitnessGoal(isActive ? '' : opt.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isActive ? 'border-[#C8F135] bg-[#C8F135]/10' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <div className="mb-1.5">
                      <Icon className={`size-5 ${isActive ? 'text-[#C8F135]' : 'text-zinc-400'}`} />
                    </div>
                    <p className={`text-xs font-semibold ${isActive ? 'text-[#C8F135]' : 'text-white'}`}>{t(`onboarding.goalsStep.goals.${GOAL_I18N[opt.value]}.label`)}</p>
                    <p className="text-xs text-zinc-500">{t(`onboarding.goalsStep.goals.${GOAL_I18N[opt.value]}.description`)}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {(fitnessGoal === 'WEIGHT_LOSS' || fitnessGoal === 'MUSCLE_GAIN') && (
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">
                {t('settings.targetWeight')} <span className="text-zinc-600">{t('onboarding.goalsStep.targetWeightOptional')}</span>
              </label>
              <input value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)}
                type="number" step="0.5" placeholder="65"
                className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#C8F135] transition-colors"
              />
            </div>
          )}

          <div>
            <p className="text-xs text-zinc-500 mb-2">{t('settings.fitnessLevel')}</p>
            <div className="grid grid-cols-2 gap-2">
              {LEVEL_OPTIONS.map((opt) => (
                <button key={opt.value} type="button"
                  onClick={() => setFitnessLevel(fitnessLevel === opt.value ? '' : opt.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    fitnessLevel === opt.value ? 'border-[#C8F135] bg-[#C8F135]/10' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <p className={`text-sm font-semibold ${fitnessLevel === opt.value ? 'text-[#C8F135]' : 'text-white'}`}>{t(`onboarding.goalsStep.levels.${LEVEL_I18N[opt.value]}.label`)}</p>
                  <p className="text-xs text-zinc-500">{t(`onboarding.goalsStep.levels.${LEVEL_I18N[opt.value]}.description`)}</p>
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Alimentation */}
        <Section title={t('settings.nutrition')}>
          <div>
            <p className="text-xs text-zinc-500 mb-2">{t('settings.dietaryRestrictions')} <span className="text-zinc-600">{t('settings.optional')}</span></p>
            <div className="flex flex-wrap gap-2">
              {RESTRICTIONS.map((r) => {
                const active = restrictions.includes(r)
                return (
                  <button key={r} type="button"
                    onClick={() => toggleList(restrictions, setRestrictions, r)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      active ? 'border-red-400 bg-red-400/10 text-red-400' : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >{t(`onboarding.diet.restrictionsOptions.${RESTRICTION_I18N[r]}`)}</button>
                )
              })}
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-2">{t('settings.foodsYouLike')} <span className="text-zinc-600">{t('settings.optional')}</span></p>
            <div className="flex flex-wrap gap-2">
              {PREFERENCES.map((p) => {
                const active = foodPrefs.includes(p)
                return (
                  <button key={p} type="button"
                    onClick={() => toggleList(foodPrefs, setFoodPrefs, p)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      active ? 'border-[#C8F135] bg-[#C8F135]/10 text-[#C8F135]' : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >{t(`onboarding.diet.preferencesOptions.${PREFERENCE_I18N[p]}`)}</button>
                )
              })}
            </div>
          </div>
        </Section>

        {/* Account actions */}
        <section className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden xl:col-span-2">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-300">{t('settings.accountSecurity')}</h2>
          </div>
          <button
            onClick={() => signOutAndClear('/')}
            className="flex items-center gap-3 w-full px-5 py-3.5 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors text-left"
          >
            <LogOut className="size-4 text-zinc-400" />
            <span className="text-sm text-zinc-300">{t('auth.signOut')}</span>
          </button>
          <button
            onClick={() => setShowDel(true)}
            className="flex items-center gap-3 w-full px-5 py-3.5 hover:bg-red-500/5 transition-colors text-left"
          >
            <Trash2 className="size-4 text-red-400" />
            <span className="text-sm text-red-400">{t('settings.deleteMyAccount')}</span>
          </button>
        </section>

            <p className="text-xs text-center text-zinc-600 xl:col-span-2">BodyOps v1.0</p>
          </div>
        </div>
        </div>
      </PageWrapper>
    </>
  )
}
