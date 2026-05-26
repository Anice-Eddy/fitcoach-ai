'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { signOut, useSession }  from 'next-auth/react'
import Link from 'next/link'
import { useUserStore }         from '@/stores/userStore'
import { PageWrapper }          from '@/components/layout/PageWrapper'
import { toast }                from 'sonner'
import { kgToLb, lbToKg, cmToFtIn, ftInToCm } from '@/utils/unit-conversions'
import { Home, Dumbbell, Building2, TreePine, LogOut, Trash2, Save, User, Sparkles, ArrowRight, Scale, Target, CalendarDays } from 'lucide-react'
import { DeleteAccountModal } from '@/components/ui/DeleteAccountModal'

// ─── constantes (mirrors onboarding steps) ──────────────────────────────────

const TRAINING_PLACES = [
  { id: 'home_bw',   label: 'À la maison',   sub: 'Sans matériel',                    icon: Home,      equipment: ['BODYWEIGHT'] },
  { id: 'home_gear', label: 'À la maison',   sub: 'Avec matériel (haltères, bandes…)', icon: Dumbbell,  equipment: ['BODYWEIGHT', 'DUMBBELL', 'KETTLEBELL', 'RESISTANCE_BAND', 'PULL_UP_BAR'] },
  { id: 'gym',       label: 'En salle',      sub: "Accès à tout l'équipement",         icon: Building2, equipment: ['BARBELL', 'DUMBBELL', 'KETTLEBELL', 'BENCH', 'CABLE_MACHINE', 'SMITH_MACHINE', 'CARDIO_MACHINE', 'PULL_UP_BAR', 'BODYWEIGHT'] },
  { id: 'outdoor',   label: 'En extérieur',  sub: 'Parcs, calisthenics, course',       icon: TreePine,  equipment: ['BODYWEIGHT', 'PULL_UP_BAR', 'RESISTANCE_BAND'] },
]

const ACTIVITY_OPTIONS = [
  { value: 'SEDENTARY',         label: 'Sédentaire',        desc: "Bureau, peu ou pas d'exercice" },
  { value: 'LIGHTLY_ACTIVE',    label: 'Légèrement actif',  desc: 'Sport 1–3 j/semaine' },
  { value: 'MODERATELY_ACTIVE', label: 'Modérément actif',  desc: 'Sport 3–5 j/semaine' },
  { value: 'VERY_ACTIVE',       label: 'Très actif',        desc: 'Sport intensif 6–7 j/semaine' },
  { value: 'EXTREMELY_ACTIVE',  label: 'Extrêmement actif', desc: 'Athlète, 2×/jour' },
]

const GOAL_OPTIONS = [
  { value: 'WEIGHT_LOSS',     emoji: '🔥', label: 'Perte de poids',      desc: 'Déficit de 500 kcal/jour' },
  { value: 'MUSCLE_GAIN',     emoji: '💪', label: 'Prise de masse',       desc: 'Surplus de 300 kcal/jour' },
  { value: 'MAINTENANCE',     emoji: '⚖️', label: 'Maintien',             desc: 'Calories de stabilité' },
  { value: 'ENDURANCE',       emoji: '🏃', label: 'Endurance',            desc: 'Performance cardio' },
  { value: 'GENERAL_FITNESS', emoji: '🎯', label: 'Forme générale',       desc: 'Santé et bien-être' },
  { value: 'FLEXIBILITY',     emoji: '🧘', label: 'Souplesse / Mobilité', desc: 'Yoga, étirements' },
]

const LEVEL_OPTIONS = [
  { value: 'BEGINNER',     label: 'Débutant',      desc: '< 6 mois' },
  { value: 'INTERMEDIATE', label: 'Intermédiaire',  desc: '6 mois – 2 ans' },
  { value: 'ADVANCED',     label: 'Avancé',         desc: '2 – 5 ans' },
  { value: 'ATHLETE',      label: 'Athlète',        desc: '5 ans+' },
]

const GENDER_OPTIONS = [
  { value: 'MALE',   label: 'Homme' },
  { value: 'FEMALE', label: 'Femme' },
]

const RESTRICTIONS = ['Végétarien', 'Végan', 'Sans gluten', 'Sans lactose', 'Halal', 'Casher', 'Sans noix', 'Sans porc']
const PREFERENCES  = ['Viande blanche', 'Poisson', 'Œufs', 'Légumineuses', 'Riz', 'Pâtes', 'Pommes de terre', 'Légumes verts', 'Fruits', 'Produits laitiers']

// ─── helpers ─────────────────────────────────────────────────────────────────

function placeIdFromEquipment(eq?: string[]): string {
  if (!eq?.length) return ''
  if (eq.includes('BARBELL')) return 'gym'
  if (eq.includes('DUMBBELL')) return 'home_gear'
  if (eq.length === 1 && eq[0] === 'BODYWEIGHT') return 'home_bw'
  return 'outdoor'
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

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


// ─── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: session }       = useSession()
  const { profile, setProfile, accompanimentMode, coachName, nextCoachSession } = useUserStore()

  const [saving,  setSaving]  = useState(false)
  const [showDel, setShowDel] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // ── units
  const [weightUnit, setWeightUnit] = useState<'KG' | 'LB'>(profile?.weightUnit ?? 'KG')
  const [heightUnit, setHeightUnit] = useState<'CM' | 'FT_IN'>(profile?.heightUnit ?? 'CM')

  // ── personal
  const [firstName, setFirstName] = useState(profile?.firstName ?? '')
  const [age,       setAge]       = useState(String(profile?.age ?? ''))
  const [gender,    setGender]    = useState(profile?.gender ?? '')

  // ── measurements (always stored in kg / cm internally)
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

  // ── activity
  const [placeId,      setPlaceId]      = useState(() => placeIdFromEquipment(profile?.availableEquipment as string[]))
  const [activityLevel, setActivityLevel] = useState(profile?.activityLevel ?? '')
  const [trainingDays,  setTrainingDays]  = useState(profile?.trainingDaysPerWeek ?? 3)

  // ── goals
  const [fitnessGoal,   setFitnessGoal]   = useState(profile?.fitnessGoal ?? '')
  const [targetWeight,  setTargetWeight]  = useState(String(profile?.targetWeightKg ?? ''))
  const [fitnessLevel,  setFitnessLevel]  = useState(profile?.fitnessLevel ?? '')

  // ── diet
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
        setPlaceId(placeIdFromEquipment(data.availableEquipment))
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
      const place = TRAINING_PLACES.find((p) => p.id === placeId)
      const body: Record<string, unknown> = {
        weightUnit,
        heightUnit,
        dietaryRestrictions: restrictions,
        foodPreferences:     foodPrefs,
        trainingDaysPerWeek: trainingDays,
      }
      if (firstName)      body.firstName     = firstName
      if (age)            body.age           = parseInt(age)
      if (gender)         body.gender        = gender
      if (weightKg)       body.weightKg      = parseFloat(weightKg)
      if (heightCm)       body.heightCm      = parseFloat(heightCm)
      if (waistCm)        body.waistCm       = parseFloat(waistCm)
      if (hipsCm)         body.hipsCm        = parseFloat(hipsCm)
      if (activityLevel)  body.activityLevel = activityLevel
      if (place)          body.availableEquipment = place.equipment
      if (fitnessGoal)    body.fitnessGoal   = fitnessGoal
      if (fitnessLevel)   body.fitnessLevel  = fitnessLevel
      if (targetWeight)   body.targetWeightKg = parseFloat(targetWeight)

      const res = await fetch('/api/user/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setProfile(updated)
      toast.success('Profil mis à jour ✓')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
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
        throw new Error(data.error ?? 'Erreur lors de la suppression')
      }
      await signOut({ callbackUrl: '/' })
    } catch (e) {
      setDeleting(false)
      throw e
    }
  }

  // ─── render ────────────────────────────────────────────────────────────────

  return (
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C8F135]">Espace personnel</p>
            <h1 className="mt-1 text-3xl font-bold text-white">Paramètres</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Ajuste ton profil, tes mensurations et tes préférences pour garder ton coaching précis.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C8F135] px-4 py-3 text-sm font-bold text-zinc-900 transition-colors hover:bg-[#d4f54d] disabled:opacity-60 sm:w-auto"
          >
            <Save className="size-4" />
            {saving ? 'Sauvegarde…' : 'Enregistrer'}
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] lg:items-start">
          <aside className="space-y-6 lg:sticky lg:top-6">
            {/* Compte */}
            <section className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800">
                <h2 className="text-sm font-semibold text-zinc-300">Compte</h2>
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
                    <div className="truncate font-medium text-white">{session?.user?.name ?? profile?.firstName ?? 'Utilisateur'}</div>
                    <div className="truncate text-sm text-zinc-400">{session?.user?.email ?? '—'}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                    <Scale className="mb-2 size-4 text-[#C8F135]" />
                    <p className="text-[11px] text-zinc-500">Poids</p>
                    <p className="truncate text-sm font-semibold text-white">{profile?.weightKg ? `${profile.weightKg} kg` : '—'}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                    <Target className="mb-2 size-4 text-[#C8F135]" />
                    <p className="text-[11px] text-zinc-500">Objectif</p>
                    <p className="truncate text-sm font-semibold text-white">{profile?.targetWeightKg ? `${profile.targetWeightKg} kg` : '—'}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                    <CalendarDays className="mb-2 size-4 text-[#C8F135]" />
                    <p className="text-[11px] text-zinc-500">Sem.</p>
                    <p className="truncate text-sm font-semibold text-white">{profile?.trainingDaysPerWeek ?? trainingDays} j</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Mon accompagnement */}
            <section className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-300">Mon accompagnement</h2>
                <span className="rounded-full bg-[#C8F135]/10 px-2.5 py-1 text-xs font-medium text-[#C8F135]">
                  {accompanimentMode === 'COACH' ? 'Coach réel' : 'IA'}
                </span>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#C8F135]/10">
                    <Sparkles className="size-5 text-[#C8F135]" />
                  </div>
                  <div>
                    {accompanimentMode === 'COACH' ? (
                      <>
                        <p className="text-sm font-medium text-white">{coachName ?? 'Coach à confirmer'}</p>
                        <p className="text-xs text-zinc-500">Prochaine séance : {nextCoachSession ?? 'à planifier'}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-white">Programme IA en cours</p>
                        <p className="text-xs text-zinc-500">{profile?.fitnessGoal ?? 'Objectif à finaliser'}</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <Link
                    href="/choose"
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#C8F135] px-4 py-2.5 text-sm font-bold text-zinc-900 transition-colors hover:bg-[#d4f54d]"
                  >
                    Changer de mode <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    href={accompanimentMode === 'COACH' ? '/choose' : '/coaches/coach-1'}
                    className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                  >
                    {accompanimentMode === 'COACH' ? 'Changer de coach' : 'Passer à un coach réel'}
                  </Link>
                </div>
              </div>
            </section>
          </aside>

          <div className="grid min-w-0 gap-6 xl:grid-cols-2">

        {/* Unités */}
        <Section title="Unités de mesure">
          <div>
            <p className="text-xs text-zinc-500 mb-2">Poids</p>
            <div className="grid grid-cols-2 gap-3">
              {(['KG', 'LB'] as const).map((u) => (
                <button key={u} type="button" onClick={() => setWeightUnit(u)}
                  className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                    weightUnit === u ? 'border-[#C8F135] bg-[#C8F135]/10 text-[#C8F135]' : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                  }`}
                >
                  {u === 'KG' ? 'Kilogrammes (kg)' : 'Livres (lb)'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-2">Taille</p>
            <div className="grid grid-cols-2 gap-3">
              {(['CM', 'FT_IN'] as const).map((u) => (
                <button key={u} type="button" onClick={() => setHeightUnit(u)}
                  className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                    heightUnit === u ? 'border-[#C8F135] bg-[#C8F135]/10 text-[#C8F135]' : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                  }`}
                >
                  {u === 'CM' ? 'Centimètres (cm)' : 'Pieds / Pouces'}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Informations personnelles */}
        <Section title="Informations personnelles">
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Prénom</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ton prénom"
              className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Âge</label>
            <input value={age} onChange={(e) => setAge(e.target.value)}
              type="number" min={13} max={100} placeholder="25"
              className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-2">Sexe</label>
            <div className="grid grid-cols-3 gap-3">
              {GENDER_OPTIONS.map((opt) => (
                <button key={opt.value} type="button"
                  onClick={() => setGender(gender === opt.value ? '' : opt.value)}
                  className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                    gender === opt.value ? 'border-[#C8F135] bg-[#C8F135]/10 text-[#C8F135]' : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Mensurations */}
        <Section title="Mensurations">
          {/* Poids */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-zinc-500">Poids</label>
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

          {/* Taille */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-zinc-500">Taille</label>
              <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded">
                {heightUnit === 'CM' ? 'cm' : 'ft / in'}
              </span>
            </div>
            {heightUnit === 'CM' ? (
              <input value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                type="number" placeholder="175"
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
                    type="number" placeholder="5 ft"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#C8F135] transition-colors"
                  />
                  <p className="text-xs text-zinc-500 mt-1 text-center">pieds</p>
                </div>
                <div className="flex-1">
                  <input value={ftDisplay.inches}
                    onChange={(e) => {
                      const f = { ...ftDisplay, inches: e.target.value }
                      setFtDisplay(f)
                      setHeightCm(String(ftInToCm(parseFloat(f.feet) || 0, parseFloat(f.inches) || 0)))
                    }}
                    type="number" placeholder="11 in"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#C8F135] transition-colors"
                  />
                  <p className="text-xs text-zinc-500 mt-1 text-center">pouces</p>
                </div>
              </div>
            )}
          </div>

          {/* Tour de taille + hanches */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">
                Tour de taille <span className="text-zinc-600">optionnel</span>
              </label>
              <input value={waistCm} onChange={(e) => setWaistCm(e.target.value)}
                type="number" placeholder="80 cm"
                className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#C8F135] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">
                Tour de hanches <span className="text-zinc-600">optionnel</span>
              </label>
              <input value={hipsCm} onChange={(e) => setHipsCm(e.target.value)}
                type="number" placeholder="95 cm"
                className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#C8F135] transition-colors"
              />
            </div>
          </div>
        </Section>

        {/* Entraînement */}
        <Section title="Entraînement" className="xl:col-span-2">
          <div>
            <p className="text-xs text-zinc-500 mb-2">Où t'entraînes-tu ?</p>
            <div className="grid grid-cols-2 gap-3">
              {TRAINING_PLACES.map((place) => {
                const Icon   = place.icon
                const active = placeId === place.id
                return (
                  <button key={place.id} type="button"
                    onClick={() => setPlaceId(placeId === place.id ? '' : place.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      active ? 'border-[#C8F135] bg-[#C8F135]/10' : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                    }`}
                  >
                    <Icon className={`size-5 mb-2 ${active ? 'text-[#C8F135]' : 'text-zinc-400'}`} />
                    <p className={`text-sm font-semibold ${active ? 'text-[#C8F135]' : 'text-white'}`}>{place.label}</p>
                    <p className="text-xs text-zinc-400 mt-0.5 leading-snug">{place.sub}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-xs text-zinc-500 mb-2">Niveau d'activité</p>
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
                    <p className={`text-sm font-medium ${activityLevel === opt.value ? 'text-[#C8F135]' : 'text-white'}`}>{opt.label}</p>
                    <p className="text-xs text-zinc-400">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-zinc-500 mb-2">
              Jours d'entraînement par semaine :{' '}
              <span className="text-[#C8F135] font-bold">{trainingDays} jour{trainingDays > 1 ? 's' : ''}</span>
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

        {/* Objectifs */}
        <Section title="Objectifs">
          <div>
            <p className="text-xs text-zinc-500 mb-2">Objectif principal</p>
            <div className="grid grid-cols-2 gap-2">
              {GOAL_OPTIONS.map((opt) => (
                <button key={opt.value} type="button"
                  onClick={() => setFitnessGoal(fitnessGoal === opt.value ? '' : opt.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    fitnessGoal === opt.value ? 'border-[#C8F135] bg-[#C8F135]/10' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <div className="text-xl mb-1">{opt.emoji}</div>
                  <p className={`text-xs font-semibold ${fitnessGoal === opt.value ? 'text-[#C8F135]' : 'text-white'}`}>{opt.label}</p>
                  <p className="text-xs text-zinc-500">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {(fitnessGoal === 'WEIGHT_LOSS' || fitnessGoal === 'MUSCLE_GAIN') && (
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">
                Poids cible <span className="text-zinc-600">optionnel, en kg</span>
              </label>
              <input value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)}
                type="number" step="0.5" placeholder="65"
                className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#C8F135] transition-colors"
              />
            </div>
          )}

          <div>
            <p className="text-xs text-zinc-500 mb-2">Niveau sportif</p>
            <div className="grid grid-cols-2 gap-2">
              {LEVEL_OPTIONS.map((opt) => (
                <button key={opt.value} type="button"
                  onClick={() => setFitnessLevel(fitnessLevel === opt.value ? '' : opt.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    fitnessLevel === opt.value ? 'border-[#C8F135] bg-[#C8F135]/10' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <p className={`text-sm font-semibold ${fitnessLevel === opt.value ? 'text-[#C8F135]' : 'text-white'}`}>{opt.label}</p>
                  <p className="text-xs text-zinc-500">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Alimentation */}
        <Section title="Alimentation">
          <div>
            <p className="text-xs text-zinc-500 mb-2">Restrictions alimentaires <span className="text-zinc-600">optionnel</span></p>
            <div className="flex flex-wrap gap-2">
              {RESTRICTIONS.map((r) => {
                const active = restrictions.includes(r)
                return (
                  <button key={r} type="button"
                    onClick={() => toggleList(restrictions, setRestrictions, r)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      active ? 'border-red-400 bg-red-400/10 text-red-400' : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >{r}</button>
                )
              })}
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-2">Aliments que tu aimes <span className="text-zinc-600">optionnel</span></p>
            <div className="flex flex-wrap gap-2">
              {PREFERENCES.map((p) => {
                const active = foodPrefs.includes(p)
                return (
                  <button key={p} type="button"
                    onClick={() => toggleList(foodPrefs, setFoodPrefs, p)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      active ? 'border-[#C8F135] bg-[#C8F135]/10 text-[#C8F135]' : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >{p}</button>
                )
              })}
            </div>
          </div>
        </Section>

        {/* Danger zone */}
        <section className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden xl:col-span-2">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-300">Danger</h2>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-3 w-full px-5 py-3.5 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors text-left"
          >
            <LogOut className="size-4 text-zinc-400" />
            <span className="text-sm text-zinc-300">Se déconnecter</span>
          </button>
          <button
            onClick={() => setShowDel(true)}
            className="flex items-center gap-3 w-full px-5 py-3.5 hover:bg-red-500/5 transition-colors text-left"
          >
            <Trash2 className="size-4 text-red-400" />
            <span className="text-sm text-red-400">Supprimer mon compte</span>
          </button>
        </section>

            <p className="text-xs text-center text-zinc-600 xl:col-span-2">BodyOps v1.0</p>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
