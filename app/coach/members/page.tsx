'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import {
  Search, User, CalendarPlus, Mail, FileText, Calendar,
  Send, ChevronRight, Trash2, Plus, X, Pin, Eye, Lock, Unlock,
  MessageSquare, ChevronDown, ChevronUp, Pencil, Check, PlusCircle,
  Footprints, Moon, Droplets, Battery, Brain, Camera,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface MemberItem {
  member: {
    id: string; name: string | null; email: string; image: string | null
    profile?: { weightKg: number; fitnessGoal: string; fitnessLevel: string } | null
    bodyMetrics: Array<{ date: string; weightKg: number }>
  }
  assignedAt: string
}

interface NoteReply {
  id: string; content: string; memberId: string
  memberName: string; createdAt: string
}

interface Note {
  id: string; title: string; content: string; category: string | null
  priority: string; status: string; isPinned: boolean; isSharedWithMember: boolean
  isImportant: boolean; tags: string[]; createdAt: string; followUpAt: string | null
  replies?: NoteReply[]
}

interface ExerciseLog {
  id: string; order: number; sets: number | null; reps: number | null
  weightKg: number | null; restSeconds: number | null; isCompleted: boolean
  exercise: { id: string; name: string; muscleGroups: string[]; equipment: string[] }
}

interface Session {
  id: string; name: string; status: string
  completedAt: string | null; durationMinutes: number | null; caloriesBurned: number | null
  scheduledAt: string | null; notes: string | null
  exerciseLogs?: ExerciseLog[]
}

interface MemberNutritionPlan {
  id: string; name: string
  targetCalories: number; targetProteinG: number; targetCarbsG: number; targetFatG: number
  isActive: boolean
}

interface Metric {
  id: string; date: string; weightKg: number | null
  bodyFatPct: number | null; waistCm: number | null
  steps: number | null; sleepHours: number | null; waterLiters: number | null
  energyLevel: number | null; stressLevel: number | null; progressPhotoUrl: string | null
  notes: string | null
}

interface Appointment {
  id: string; title: string; scheduledAt: string; duration: number
  status: string; description: string | null; coachNote: string | null
  memberNote: string | null; meetLink: string | null
}

interface MemberDetail {
  id: string; name: string | null; email: string; image: string | null; assignedAt: string
  profile: {
    firstName: string; age: number; gender: string; weightKg: number; heightCm: number
    targetWeightKg: number | null; fitnessGoal: string; fitnessLevel: string
    activityLevel: string; trainingDaysPerWeek: number; bmi: number | null; tdee: number | null
    recommendedCalories: number | null; recommendedProteinG: number | null
    recommendedCarbsG: number | null; recommendedFatG: number | null
  } | null
  bodyMetrics: Metric[]
  workoutSessions: Session[]
  nutritionPlans: MemberNutritionPlan[]
  coachNotes: Note[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GOAL_LABELS: Record<string, string> = {
  WEIGHT_LOSS: 'Perte de poids', MUSCLE_GAIN: 'Prise de masse',
  MAINTENANCE: 'Maintien', ENDURANCE: 'Endurance',
  FLEXIBILITY: 'Flexibilité', GENERAL_FITNESS: 'Forme générale',
}
const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Débutant', INTERMEDIATE: 'Intermédiaire', ADVANCED: 'Avancé',
}
const STATUS_STYLE: Record<string, { dot: string; text: string; label: string }> = {
  CONFIRMED: { dot: 'bg-[#C8F135]',  text: 'text-[#C8F135]',  label: 'Confirmé' },
  PENDING:   { dot: 'bg-yellow-400', text: 'text-yellow-400', label: 'En attente' },
  PROPOSED:  { dot: 'bg-blue-400',   text: 'text-blue-400',   label: 'Proposé' },
  CANCELLED: { dot: 'bg-red-400',    text: 'text-red-400',    label: 'Annulé' },
  COMPLETED: { dot: 'bg-zinc-500',   text: 'text-zinc-500',   label: 'Terminé' },
}
const SESSION_STYLE: Record<string, { dot: string; label: string }> = {
  COMPLETED:   { dot: 'bg-emerald-400', label: 'Complété' },
  IN_PROGRESS: { dot: 'bg-[#C8F135]',  label: 'En cours' },
  PLANNED:     { dot: 'bg-zinc-500',    label: 'Planifié' },
  SKIPPED:     { dot: 'bg-red-400',     label: 'Manqué' },
}
const ACTIVITY_LABELS: Record<string, string> = {
  SEDENTARY: 'Sédentaire',
  LIGHTLY_ACTIVE: 'Légèrement actif',
  MODERATELY_ACTIVE: 'Modérément actif',
  VERY_ACTIVE: 'Très actif',
  EXTREMELY_ACTIVE: 'Extrêmement actif',
}
const EQUIPMENT_LABELS: Record<string, string> = {
  BODYWEIGHT: 'Poids du corps',
  DUMBBELL: 'Haltères',
  BARBELL: 'Barre',
  BENCH: 'Banc',
  KETTLEBELL: 'Kettlebell',
  RESISTANCE_BAND: 'Élastiques',
  PULL_UP_BAR: 'Barre traction',
  CABLE_MACHINE: 'Poulie',
  SMITH_MACHINE: 'Smith machine',
  CARDIO_MACHINE: 'Machine cardio',
  CHEST_PRESS_MACHINE: 'Chest press',
  HIP_THRUST_MACHINE: 'Hip thrust',
}

type CreateMemberForm = {
  firstName: string; lastName: string; email: string; password: string
  age: string; gender: 'MALE' | 'FEMALE'
  weightKg: string; heightCm: string; waistCm: string; hipsCm: string; bodyFatPct: string
  activityLevel: string; trainingDaysPerWeek: string; availableEquipment: string[]
  fitnessGoal: string; fitnessLevel: string; targetWeightKg: string; bodyFocus: string
  dietaryRestrictions: string; foodPreferences: string
  steps: string; sleepHours: string; waterLiters: string; notes: string
}

const emptyCreateMemberForm: CreateMemberForm = {
  firstName: '', lastName: '', email: '', password: '',
  age: '', gender: 'MALE',
  weightKg: '', heightCm: '', waistCm: '', hipsCm: '', bodyFatPct: '',
  activityLevel: 'MODERATELY_ACTIVE', trainingDaysPerWeek: '3', availableEquipment: ['BODYWEIGHT'],
  fitnessGoal: 'GENERAL_FITNESS', fitnessLevel: 'BEGINNER', targetWeightKg: '', bodyFocus: 'FULL_BODY',
  dietaryRestrictions: '', foodPreferences: '',
  steps: '', sleepHours: '', waterLiters: '', notes: '',
}

// Returns 2-letter uppercase initials from a display name or email fallback.
function initials(name: string | null, email: string) {
  if (name) return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

// Tab toggle button with active highlight style.
function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap',
        active ? 'bg-[#C8F135] text-zinc-900' : 'text-zinc-400 hover:text-white hover:bg-zinc-800',
      )}
    >
      {children}
    </button>
  )
}

// Small stat card with label, bold value, and optional sub-text.
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  )
}

// Displays a summary of the member's profile: physical stats, goals, BMI, latest metrics, and active program.
function OverviewTab({ detail, onRefresh }: { detail: MemberDetail; onRefresh: () => void }) {
  const p = detail.profile
  const last = detail.bodyMetrics[0]
  const lastWeight = detail.bodyMetrics.find(metric => typeof metric.weightKg === 'number')?.weightKg ?? null
  const doneSessions = detail.workoutSessions.filter(s => s.status === 'COMPLETED').length
  const totalMin = detail.workoutSessions.reduce((a, s) => a + (s.durationMinutes ?? 0), 0)
  const coachPlan = detail.nutritionPlans[0] ?? null
  const [nutritionForm, setNutritionForm] = useState({
    targetCalories: coachPlan?.targetCalories ? String(Math.round(coachPlan.targetCalories)) : '',
    targetProteinG: coachPlan?.targetProteinG ? String(Math.round(coachPlan.targetProteinG)) : '',
    targetCarbsG: coachPlan?.targetCarbsG ? String(Math.round(coachPlan.targetCarbsG)) : '',
    targetFatG: coachPlan?.targetFatG ? String(Math.round(coachPlan.targetFatG)) : '',
  })
  const [savingNutrition, setSavingNutrition] = useState(false)

  useEffect(() => {
    setNutritionForm({
      targetCalories: coachPlan?.targetCalories ? String(Math.round(coachPlan.targetCalories)) : '',
      targetProteinG: coachPlan?.targetProteinG ? String(Math.round(coachPlan.targetProteinG)) : '',
      targetCarbsG: coachPlan?.targetCarbsG ? String(Math.round(coachPlan.targetCarbsG)) : '',
      targetFatG: coachPlan?.targetFatG ? String(Math.round(coachPlan.targetFatG)) : '',
    })
  }, [coachPlan?.targetCalories, coachPlan?.targetProteinG, coachPlan?.targetCarbsG, coachPlan?.targetFatG])

  const fillNutritionFromRecommendation = () => {
    setNutritionForm({
      targetCalories: p?.recommendedCalories ? String(Math.round(p.recommendedCalories)) : '',
      targetProteinG: p?.recommendedProteinG ? String(Math.round(p.recommendedProteinG)) : '',
      targetCarbsG: p?.recommendedCarbsG ? String(Math.round(p.recommendedCarbsG)) : '',
      targetFatG: p?.recommendedFatG ? String(Math.round(p.recommendedFatG)) : '',
    })
  }

  const saveNutritionTargets = async () => {
    setSavingNutrition(true)
    const res = await fetch(`/api/coach/members/${detail.id}/nutrition-targets`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nutritionForm),
    })
    if (res.ok) onRefresh()
    setSavingNutrition(false)
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Poids actuel" value={lastWeight ? `${lastWeight} kg` : '—'} sub={p?.targetWeightKg ? `Objectif : ${p.targetWeightKg} kg` : undefined} />
        <StatCard label="IMC" value={p?.bmi ? p.bmi.toFixed(1) : '—'} sub={p ? `${p.heightCm} cm` : undefined} />
        <StatCard label="Séances complétées" value={String(doneSessions)} sub={totalMin ? `${totalMin} min total` : undefined} />
        <StatCard label="Objectif" value={p ? (GOAL_LABELS[p.fitnessGoal] ?? p.fitnessGoal) : '—'} sub={p ? (LEVEL_LABELS[p.fitnessLevel] ?? p.fitnessLevel) : undefined} />
      </div>

      {p && (p.recommendedCalories || p.tdee) && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Plan nutritionnel recommandé</p>
            <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-500">Calcul BodyOps</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-lg bg-zinc-800 border border-zinc-700">
              <p className="text-lg font-bold text-white font-mono">{p.recommendedCalories ? Math.round(p.recommendedCalories).toLocaleString('fr-FR') : '—'}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">kcal / jour</p>
            </div>
            {[
              { label: 'Protéines', v: p.recommendedProteinG, color: 'text-[#C8F135]' },
              { label: 'Glucides',  v: p.recommendedCarbsG,   color: 'text-blue-400' },
              { label: 'Lipides',   v: p.recommendedFatG,     color: 'text-pink-400' },
            ].map(m => (
              <div key={m.label} className="text-center p-3 rounded-lg bg-zinc-800 border border-zinc-700">
                <p className={`text-lg font-bold font-mono ${m.color}`}>{m.v ? `${Math.round(m.v)}g` : '—'}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Objectif nutrition coach</p>
            <p className="mt-1 text-xs text-zinc-500">Ces valeurs sont visibles côté membre et remplacent les recommandations auto pour les objectifs quotidiens.</p>
          </div>
          <button
            type="button"
            onClick={fillNutritionFromRecommendation}
            className="self-start rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-[#C8F135]/50 hover:text-[#C8F135] sm:self-auto"
          >
            Reprendre la reco
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { key: 'targetCalories', label: 'Calories', suffix: 'kcal', min: 800, max: 8000 },
            { key: 'targetProteinG', label: 'Protéines', suffix: 'g', min: 20, max: 500 },
            { key: 'targetCarbsG', label: 'Glucides', suffix: 'g', min: 20, max: 1000 },
            { key: 'targetFatG', label: 'Lipides', suffix: 'g', min: 10, max: 400 },
          ].map(field => (
            <label key={field.key} className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">{field.label}</span>
              <div className="flex rounded-lg border border-zinc-700 bg-zinc-950 focus-within:border-[#C8F135]">
                <input
                  type="number"
                  min={field.min}
                  max={field.max}
                  value={nutritionForm[field.key as keyof typeof nutritionForm]}
                  onChange={e => setNutritionForm(form => ({ ...form, [field.key]: e.target.value }))}
                  className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white outline-none"
                />
                <span className="border-l border-zinc-800 px-3 py-2 text-xs text-zinc-500">{field.suffix}</span>
              </div>
            </label>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[11px] text-zinc-600">
            {coachPlan ? 'Un objectif coach est actif pour ce membre.' : 'Aucun objectif coach personnalisé pour le moment.'}
          </p>
          <button
            type="button"
            onClick={saveNutritionTargets}
            disabled={savingNutrition || !nutritionForm.targetCalories || !nutritionForm.targetProteinG || !nutritionForm.targetCarbsG || !nutritionForm.targetFatG}
            className="rounded-lg bg-[#C8F135] px-3 py-2 text-xs font-bold text-zinc-950 transition-colors hover:bg-[#d4f54d] disabled:opacity-50"
          >
            {savingNutrition ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {detail.bodyMetrics.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Historique de poids (récent)</p>
          <div className="space-y-1.5">
            {detail.bodyMetrics.slice(0, 5).map(m => (
              <div key={m.id} className="flex justify-between items-center text-sm border-b border-zinc-800/60 pb-1.5 last:border-0">
                <span className="text-zinc-400">{format(new Date(m.date), 'd MMM yyyy', { locale: fr })}</span>
                <span className="font-mono text-white font-medium">{m.weightKg ? `${m.weightKg} kg` : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {last && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Derniers signaux de récupération</p>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
            <CoachSignal icon={<Footprints className="size-3.5" />} label="Pas" value={last.steps ? last.steps.toLocaleString('fr-FR') : '—'} />
            <CoachSignal icon={<Moon className="size-3.5" />} label="Sommeil" value={last.sleepHours ? `${last.sleepHours} h` : '—'} />
            <CoachSignal icon={<Droplets className="size-3.5" />} label="Litres d'eau" value={last.waterLiters ? `${last.waterLiters} L` : '—'} />
            <CoachSignal icon={<Battery className="size-3.5" />} label="Énergie" value={last.energyLevel ? `${last.energyLevel}/5` : '—'} />
            <CoachSignal icon={<Brain className="size-3.5" />} label="Stress" value={last.stressLevel ? `${last.stressLevel}/5` : '—'} />
          </div>
          {last.progressPhotoUrl && (
            <a href={last.progressPhotoUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#C8F135] hover:text-[#d4f54d]">
              <Camera className="size-3.5" /> Voir la photo de progression
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function CoachSignal({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-800/60 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-zinc-500">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <p className="font-mono text-sm font-semibold text-white">{value}</p>
    </div>
  )
}

function CoachMetricInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  min: number
  max: number
  step: string
  placeholder: string
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] text-zinc-500">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded border border-zinc-600 bg-zinc-700 px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#C8F135]"
      />
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
  min,
  max,
  step,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  placeholder?: string
  min?: number
  max?: number
  step?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
        {label}{required ? ' *' : ''}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#C8F135]"
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-[#C8F135]"
      >
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  )
}

function CreateMemberModal({
  open,
  saving,
  error,
  form,
  setForm,
  onClose,
  onSubmit,
}: {
  open: boolean
  saving: boolean
  error: string | null
  form: CreateMemberForm
  setForm: (updater: (form: CreateMemberForm) => CreateMemberForm) => void
  onClose: () => void
  onSubmit: () => void
}) {
  if (!open) return null

  const set = (key: keyof CreateMemberForm, value: string) => setForm(f => ({ ...f, [key]: value }))
  const toggleEquipment = (value: string) => {
    setForm(f => ({
      ...f,
      availableEquipment: f.availableEquipment.includes(value)
        ? f.availableEquipment.filter(item => item !== value)
        : [...f.availableEquipment, value],
    }))
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-3 py-4 sm:px-6">
      <div className="mx-auto w-full max-w-5xl rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur sm:px-6">
          <div>
            <h3 className="text-base font-bold text-white">Ajouter un client</h3>
            <p className="text-xs text-zinc-500">Le compte membre, son profil et la relation coach seront créés ensemble.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-900 hover:text-white" aria-label="Fermer">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-6 p-4 sm:p-6">
          {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}

          <section className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Compte</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Prénom" value={form.firstName} onChange={v => set('firstName', v)} required />
              <Field label="Nom" value={form.lastName} onChange={v => set('lastName', v)} />
              <Field label="Email" type="email" value={form.email} onChange={v => set('email', v)} required />
              <Field label="Mot de passe temporaire" type="password" value={form.password} onChange={v => set('password', v)} required placeholder="8 caractères minimum" />
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Profil physique</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Field label="Âge" type="number" min={13} max={100} value={form.age} onChange={v => set('age', v)} required />
              <SelectField label="Genre" value={form.gender} onChange={v => set('gender', v)} options={[{ value: 'MALE', label: 'Homme' }, { value: 'FEMALE', label: 'Femme' }]} />
              <Field label="Poids kg" type="number" step="0.1" min={30} max={300} value={form.weightKg} onChange={v => set('weightKg', v)} required />
              <Field label="Taille cm" type="number" step="1" min={100} max={250} value={form.heightCm} onChange={v => set('heightCm', v)} required />
              <Field label="Objectif kg" type="number" step="0.1" min={30} max={300} value={form.targetWeightKg} onChange={v => set('targetWeightKg', v)} />
              <Field label="Tour taille cm" type="number" step="0.5" value={form.waistCm} onChange={v => set('waistCm', v)} />
              <Field label="Hanches cm" type="number" step="0.5" value={form.hipsCm} onChange={v => set('hipsCm', v)} />
              <Field label="% masse grasse" type="number" step="0.1" value={form.bodyFatPct} onChange={v => set('bodyFatPct', v)} />
              <Field label="Pas" type="number" value={form.steps} onChange={v => set('steps', v)} />
              <Field label="Sommeil h" type="number" step="0.25" value={form.sleepHours} onChange={v => set('sleepHours', v)} />
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Objectifs et activité</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SelectField label="Objectif" value={form.fitnessGoal} onChange={v => set('fitnessGoal', v)} options={Object.entries(GOAL_LABELS).map(([value, label]) => ({ value, label }))} />
              <SelectField label="Niveau" value={form.fitnessLevel} onChange={v => set('fitnessLevel', v)} options={Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label }))} />
              <SelectField label="Activité" value={form.activityLevel} onChange={v => set('activityLevel', v)} options={Object.entries(ACTIVITY_LABELS).map(([value, label]) => ({ value, label }))} />
              <Field label="Jours / semaine" type="number" min={1} max={7} value={form.trainingDaysPerWeek} onChange={v => set('trainingDaysPerWeek', v)} />
              <SelectField label="Focus" value={form.bodyFocus} onChange={v => set('bodyFocus', v)} options={[
                { value: 'FULL_BODY', label: 'Corps complet' },
                { value: 'UPPER_BODY', label: 'Haut du corps' },
                { value: 'LOWER_BODY', label: 'Bas du corps' },
              ]} />
              <Field label="Litres eau" type="number" step="0.1" value={form.waterLiters} onChange={v => set('waterLiters', v)} />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(EQUIPMENT_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleEquipment(value)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-left text-xs transition-colors',
                    form.availableEquipment.includes(value)
                      ? 'border-[#C8F135]/50 bg-[#C8F135]/10 text-[#C8F135]'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Nutrition et notes</p>
            <div className="grid gap-3 lg:grid-cols-2">
              <Field label="Restrictions alimentaires" value={form.dietaryRestrictions} onChange={v => set('dietaryRestrictions', v)} placeholder="VEGETARIAN, GLUTEN_FREE..." />
              <Field label="Préférences alimentaires" value={form.foodPreferences} onChange={v => set('foodPreferences', v)} placeholder="Riz, poulet, skyr..." />
            </div>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Notes initiales visibles par le coach"
              rows={3}
              className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#C8F135]"
            />
          </section>

          <div className="flex flex-col-reverse gap-2 border-t border-zinc-800 pt-4 sm:flex-row sm:justify-end">
            <button onClick={onClose} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-900">
              Annuler
            </button>
            <button
              onClick={onSubmit}
              disabled={saving}
              className="rounded-lg bg-[#C8F135] px-4 py-2 text-sm font-bold text-zinc-950 hover:bg-[#d4f54d] disabled:opacity-50"
            >
              {saving ? 'Création…' : 'Créer le client'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Notes Tab ────────────────────────────────────────────────────────────────

// Expandable section showing existing replies on a coach note and allowing the coach to fetch the latest replies.
function NoteRepliesSection({ noteId, replies: initialReplies }: { noteId: string; replies: NoteReply[] }) {
  const [expanded, setExpanded]   = useState(false)
  const [replies, setReplies]     = useState<NoteReply[]>(initialReplies)
  const [loading, setLoading]     = useState(false)

  const fetchReplies = async () => {
    setLoading(true)
    const res = await fetch(`/api/coach/notes/${noteId}/replies`).catch(() => null)
    const data = res ? await res.json().catch(() => []) : []
    if (Array.isArray(data)) setReplies(data.map((r: { id: string; content: string; memberId: string; member?: { name?: string }; createdAt: string }) => ({
      id: r.id, content: r.content, memberId: r.memberId,
      memberName: r.member?.name ?? 'Membre', createdAt: r.createdAt,
    })))
    setLoading(false)
  }

  const deleteReply = async (replyId: string) => {
    if (!confirm('Supprimer cette réponse ?')) return
    await fetch(`/api/coach/notes/${noteId}/replies`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ replyId }),
    })
    await fetchReplies()
  }

  const handleToggle = () => {
    if (!expanded) fetchReplies()
    setExpanded(v => !v)
  }

  if (replies.length === 0 && !expanded) return null

  return (
    <div className="mt-3 border-t border-zinc-700/50 pt-3">
      <button
        onClick={handleToggle}
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <MessageSquare className="size-3.5" />
        {replies.length} réponse{replies.length !== 1 ? 's' : ''}
        {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {loading ? (
            <p className="text-xs text-zinc-600 italic">Chargement…</p>
          ) : replies.length === 0 ? (
            <p className="text-xs text-zinc-600 italic">Aucune réponse</p>
          ) : replies.map(r => (
            <div key={r.id} className="flex items-start gap-2 bg-zinc-800/50 rounded-lg px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-zinc-400">{r.memberName}</p>
                <p className="text-xs text-zinc-300 mt-0.5">{r.content}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">
                  {format(new Date(r.createdAt), "d MMM 'à' HH:mm", { locale: fr })}
                </p>
              </div>
              <button
                onClick={() => deleteReply(r.id)}
                className="text-zinc-600 hover:text-red-400 transition-colors shrink-0 mt-0.5"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Notes management tab: create, share, pin, and delete coach notes for this member.
function NotesTab({ detail, onRefresh }: { detail: MemberDetail; onRefresh: () => void }) {
  const [notes, setNotes]       = useState<Note[]>(detail.coachNotes)
  const [form, setForm]         = useState({ title: '', content: '', shared: false, important: false })
  const [saving, setSaving]     = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => setNotes(detail.coachNotes), [detail.coachNotes])

  const submit = async () => {
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    await fetch('/api/coach/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberId:          detail.id,
        title:             form.title,
        content:           form.content,
        isSharedWithMember: form.shared,
        isImportant:       form.important,
        status:            'OPEN',
        priority:          'MEDIUM',
        tags:              [],
        isPinned:          false,
      }),
    })
    setForm({ title: '', content: '', shared: false, important: false })
    setShowForm(false)
    setSaving(false)
    onRefresh()
  }

  const toggleImportant = async (note: Note) => {
    setToggling(note.id)
    await fetch('/api/coach/notes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId: note.id, isImportant: !note.isImportant }),
    })
    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, isImportant: !n.isImportant } : n))
    setToggling(null)
  }

  const deleteNote = async (noteId: string) => {
    if (!confirm('Supprimer cette note définitivement ?')) return
    setDeleting(noteId)
    await fetch('/api/coach/notes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId }),
    })
    setNotes(prev => prev.filter(n => n.id !== noteId))
    setDeleting(null)
  }

  const PRIORITY_COLOR: Record<string, string> = { HIGH: 'text-red-400', MEDIUM: 'text-yellow-400', LOW: 'text-zinc-500' }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-900 bg-[#C8F135] hover:bg-[#d4f54d] px-3 py-1.5 rounded-lg transition-colors"
        >
          {showForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
          {showForm ? 'Annuler' : 'Nouvelle note'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 space-y-3">
          <input
            placeholder="Titre de la note"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135]"
          />
          <textarea
            placeholder="Contenu de la note…"
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            rows={4}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] resize-none"
          />
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
              <input type="checkbox" checked={form.shared} onChange={e => setForm(f => ({ ...f, shared: e.target.checked }))} className="accent-[#C8F135]" />
              Partager avec le membre
            </label>
            <label className="flex items-center gap-2 text-xs text-amber-400 cursor-pointer">
              <input type="checkbox" checked={form.important} onChange={e => setForm(f => ({ ...f, important: e.target.checked }))} className="accent-amber-400" />
              Marquer comme importante
            </label>
          </div>
          <div className="flex justify-end">
            <button
              onClick={submit}
              disabled={saving || !form.title.trim() || !form.content.trim()}
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-900 bg-[#C8F135] hover:bg-[#d4f54d] px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
            >
              <Send className="size-3.5" />
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}

      {notes.length === 0 && !showForm ? (
        <div className="py-10 text-center">
          <FileText className="size-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">Aucune note pour ce membre</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(n => (
            <div key={n.id} className={cn(
              'rounded-xl border p-4',
              n.isImportant ? 'border-amber-500/40 bg-amber-500/5' : n.isPinned ? 'border-[#C8F135]/30 bg-[#C8F135]/5' : 'border-zinc-800 bg-zinc-900',
            )}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {n.isImportant && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                        <Lock className="size-2.5" /> Importante
                      </span>
                    )}
                    {n.isPinned && <Pin className="size-3 text-[#C8F135] shrink-0" />}
                    <p className="text-sm font-medium text-white truncate">{n.title}</p>
                    <span className={cn('text-[10px] font-semibold shrink-0', PRIORITY_COLOR[n.priority])}>{n.priority}</span>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-3">{n.content}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-[10px] text-zinc-600">{format(new Date(n.createdAt), 'd MMM yyyy', { locale: fr })}</span>
                    {n.isSharedWithMember && (
                      <span className="flex items-center gap-1 text-[10px] text-[#C8F135]">
                        <Eye className="size-3" /> Partagée
                      </span>
                    )}
                    {n.category && <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">{n.category}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleImportant(n)}
                    disabled={toggling === n.id}
                    title={n.isImportant ? 'Retirer l\'importance' : 'Marquer comme importante'}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors disabled:opacity-50',
                      n.isImportant ? 'text-amber-400 bg-amber-400/10 hover:bg-amber-400/20' : 'text-zinc-500 hover:text-amber-400 hover:bg-zinc-800',
                    )}
                  >
                    {n.isImportant ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
                  </button>
                  <button
                    onClick={() => deleteNote(n.id)}
                    disabled={deleting === n.id}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Replies */}
              <NoteRepliesSection noteId={n.id} replies={n.replies ?? []} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Activity tab: displays and manages body metrics and workout sessions for the member, with add/delete and session status editing.
function ActivityTab({ detail, memberId, onRefresh }: { detail: MemberDetail; memberId: string; onRefresh: () => void }) {
  const [metrics, setMetrics]             = useState<Metric[]>(detail.bodyMetrics)
  const [sessions, setSessions]           = useState<Session[]>(detail.workoutSessions)
  const [showMetricForm, setShowMetricForm] = useState(false)
  const [metricForm, setMetricForm]       = useState({
    weightKg: '',
    bodyFatPct: '',
    waistCm: '',
    steps: '',
    sleepHours: '',
    waterLiters: '',
    energyLevel: '',
    stressLevel: '',
    progressPhotoUrl: '',
    notes: '',
  })
  const [savingMetric, setSavingMetric]   = useState(false)
  const [deletingMetric, setDeletingMetric] = useState<string | null>(null)
  const [editingSession, setEditingSession] = useState<string | null>(null)
  const [sessionNotes, setSessionNotes]   = useState<Record<string, string>>({})
  const [savingSession, setSavingSession] = useState<string | null>(null)
  const [deletingExercise, setDeletingExercise] = useState<string | null>(null)
  const [deletingSession, setDeletingSession] = useState<string | null>(null)

  useEffect(() => { setMetrics(detail.bodyMetrics); setSessions(detail.workoutSessions) }, [detail])

  const emptyMetricForm = {
    weightKg: '',
    bodyFatPct: '',
    waistCm: '',
    steps: '',
    sleepHours: '',
    waterLiters: '',
    energyLevel: '',
    stressLevel: '',
    progressPhotoUrl: '',
    notes: '',
  }

  const nullableNumber = (value: string) => value ? Number(value) : null

  const addMetric = async () => {
    if (!metricForm.weightKg) return
    setSavingMetric(true)
    const res = await fetch(`/api/coach/members/${memberId}/metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weightKg:   Number(metricForm.weightKg),
        bodyFatPct: nullableNumber(metricForm.bodyFatPct),
        waistCm:    nullableNumber(metricForm.waistCm),
        // Le coach peut compléter ces valeurs, mais elles restent stockées dans la même table que côté membre.
        steps:            nullableNumber(metricForm.steps),
        sleepHours:       nullableNumber(metricForm.sleepHours),
        waterLiters:      nullableNumber(metricForm.waterLiters),
        energyLevel:      nullableNumber(metricForm.energyLevel),
        stressLevel:      nullableNumber(metricForm.stressLevel),
        progressPhotoUrl: metricForm.progressPhotoUrl || null,
        notes:            metricForm.notes || null,
      }),
    })
    if (res.ok) {
      const newMetric = await res.json()
      setMetrics(prev => [newMetric, ...prev])
      setMetricForm(emptyMetricForm)
      setShowMetricForm(false)
      onRefresh()
    }
    setSavingMetric(false)
  }

  const deleteMetric = async (metricId: string) => {
    if (!confirm('Supprimer cette mesure ?')) return
    setDeletingMetric(metricId)
    await fetch(`/api/coach/members/${memberId}/metrics`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metricId }),
    })
    setMetrics(prev => prev.filter(m => m.id !== metricId))
    setDeletingMetric(null)
  }

  const updateSessionStatus = async (session: Session, newStatus: string) => {
    setSavingSession(session.id)
    const res = await fetch(`/api/coach/members/${memberId}/sessions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.id, status: newStatus }),
    })
    if (res.ok) {
      const updated = await res.json()
      setSessions(prev => prev.map(s => s.id === session.id ? { ...s, ...updated } : s))
    }
    setSavingSession(null)
  }

  const saveSessionNote = async (sessionId: string) => {
    const note = sessionNotes[sessionId]
    if (note === undefined) return
    setSavingSession(sessionId)
    await fetch(`/api/coach/members/${memberId}/sessions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, notes: note }),
    })
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, notes: note } : s))
    setEditingSession(null)
    setSavingSession(null)
  }

  const deleteSessionExercise = async (sessionId: string, exerciseLogId: string) => {
    if (!confirm('Supprimer cet exercice de la séance ?')) return
    setDeletingExercise(exerciseLogId)
    const res = await fetch(`/api/coach/members/${memberId}/sessions`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, exerciseLogId }),
    })

    if (res.ok) {
      // L'API renvoie la séance à jour pour éviter une désynchronisation avec la base.
      const updated = await res.json()
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ...updated } : s))
      onRefresh()
    }
    setDeletingExercise(null)
  }

  const deleteWorkoutSession = async (sessionId: string) => {
    if (!confirm('Supprimer cette séance complète ? Les exercices associés seront aussi supprimés.')) return
    setDeletingSession(sessionId)
    const res = await fetch(`/api/coach/members/${memberId}/sessions`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })

    if (res.ok) {
      // La suppression d'une séance retire aussi ses exercices en base via Prisma.
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      onRefresh()
    }
    setDeletingSession(null)
  }

  return (
    <div className="space-y-5">
      {/* Body Metrics */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Mensurations</p>
          <button
            onClick={() => setShowMetricForm(v => !v)}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-[#C8F135] transition-colors"
          >
            <PlusCircle className="size-3.5" /> Ajouter
          </button>
        </div>

        {showMetricForm && (
          <div className="mb-4 p-3 rounded-lg bg-zinc-800 border border-zinc-700 space-y-2">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Poids (kg) *</label>
                <input
                  type="number" step="0.1" placeholder="70.5"
                  value={metricForm.weightKg}
                  onChange={e => setMetricForm(f => ({ ...f, weightKg: e.target.value }))}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#C8F135]"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">% Masse grasse</label>
                <input
                  type="number" step="0.1" placeholder="20.0"
                  value={metricForm.bodyFatPct}
                  onChange={e => setMetricForm(f => ({ ...f, bodyFatPct: e.target.value }))}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#C8F135]"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Tour de taille (cm)</label>
                <input
                  type="number" step="0.5" placeholder="80"
                  value={metricForm.waistCm}
                  onChange={e => setMetricForm(f => ({ ...f, waistCm: e.target.value }))}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#C8F135]"
                />
              </div>
              <CoachMetricInput label="Pas" value={metricForm.steps} onChange={value => setMetricForm(f => ({ ...f, steps: value }))} min={0} max={100000} step="1" placeholder="8000" />
              <CoachMetricInput label="Sommeil (h)" value={metricForm.sleepHours} onChange={value => setMetricForm(f => ({ ...f, sleepHours: value }))} min={0} max={24} step="0.25" placeholder="7.5" />
              <CoachMetricInput label="Litres d'eau" value={metricForm.waterLiters} onChange={value => setMetricForm(f => ({ ...f, waterLiters: value }))} min={0} max={15} step="0.1" placeholder="2.0" />
              <CoachMetricInput label="Énergie 1-5" value={metricForm.energyLevel} onChange={value => setMetricForm(f => ({ ...f, energyLevel: value }))} min={1} max={5} step="1" placeholder="4" />
              <CoachMetricInput label="Stress 1-5" value={metricForm.stressLevel} onChange={value => setMetricForm(f => ({ ...f, stressLevel: value }))} min={1} max={5} step="1" placeholder="2" />
            </div>
            <input
              type="url"
              placeholder="URL photo de progression"
              value={metricForm.progressPhotoUrl}
              onChange={e => setMetricForm(f => ({ ...f, progressPhotoUrl: e.target.value }))}
              className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#C8F135]"
            />
            <input
              placeholder="Note optionnelle"
              value={metricForm.notes}
              onChange={e => setMetricForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#C8F135]"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowMetricForm(false)} className="text-xs text-zinc-400 hover:text-white px-3 py-1.5">Annuler</button>
              <button
                onClick={addMetric}
                disabled={savingMetric || !metricForm.weightKg}
                className="flex items-center gap-1 text-xs font-medium text-zinc-900 bg-[#C8F135] hover:bg-[#d4f54d] px-3 py-1.5 rounded disabled:opacity-50 transition-colors"
              >
                {savingMetric ? 'Enregistrement…' : 'Ajouter'}
              </button>
            </div>
          </div>
        )}

        {metrics.length === 0 ? (
          <p className="text-xs text-zinc-600 italic">Aucune mensuration enregistrée.</p>
        ) : (
          <div className="space-y-1">
            {metrics.slice(0, 15).map(m => (
              <div key={m.id} className="grid gap-2 border-b border-zinc-800/60 py-2 text-xs last:border-0 sm:grid-cols-[1fr_auto] sm:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-zinc-400">{format(new Date(m.date), 'd MMM yyyy', { locale: fr })}</span>
                    <span className="font-mono font-semibold text-white">{m.weightKg ? `${m.weightKg} kg` : '— kg'}</span>
                    <span className="text-zinc-500">{m.bodyFatPct ? `${m.bodyFatPct}% MG` : '— MG'}</span>
                    <span className="text-zinc-500">{m.waistCm ? `${m.waistCm} cm taille` : '— taille'}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                    <span>{m.steps ? `${m.steps.toLocaleString('fr-FR')} pas` : '— pas'}</span>
                    <span>{m.sleepHours ? `${m.sleepHours} h sommeil` : '— sommeil'}</span>
                    <span>{m.waterLiters ? `${m.waterLiters} L eau` : '— eau'}</span>
                    <span>{m.energyLevel ? `énergie ${m.energyLevel}/5` : '— énergie'}</span>
                    <span>{m.stressLevel ? `stress ${m.stressLevel}/5` : '— stress'}</span>
                    {m.progressPhotoUrl ? <a href={m.progressPhotoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#C8F135]"><Camera className="size-3" /> photo</a> : null}
                  </div>
                  {m.notes ? <p className="mt-1 truncate text-[11px] text-zinc-600">{m.notes}</p> : null}
                </div>
                <button
                  onClick={() => deleteMetric(m.id)}
                  disabled={deletingMetric === m.id}
                  className="justify-self-end text-zinc-700 transition-colors hover:text-red-400 disabled:opacity-50"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workout Sessions */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Séances d'entraînement</p>
        {sessions.length === 0 ? (
          <p className="text-xs text-zinc-600 italic">Aucune séance enregistrée.</p>
        ) : (
          <div className="space-y-3">
            {sessions.slice(0, 15).map(s => {
              const st = SESSION_STYLE[s.status] ?? SESSION_STYLE.PLANNED
              const isEditing = editingSession === s.id
              return (
                <div key={s.id} className="rounded-lg border border-zinc-800 bg-zinc-800/40 p-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className={cn('size-2 rounded-full shrink-0', st.dot)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{s.name}</p>
                      {s.completedAt && (
                        <p className="text-xs text-zinc-500">
                          {format(new Date(s.completedAt), 'd MMM', { locale: fr })}
                          {s.durationMinutes && ` · ${s.durationMinutes} min`}
                          {s.caloriesBurned && ` · ${s.caloriesBurned} kcal`}
                        </p>
                      )}
                    </div>

                    {/* Status selector */}
                    <select
                      value={s.status}
                      onChange={e => updateSessionStatus(s, e.target.value)}
                      disabled={savingSession === s.id}
                      className="text-xs bg-zinc-700 border border-zinc-600 text-zinc-300 rounded px-2 py-1 focus:outline-none focus:border-[#C8F135] disabled:opacity-50"
                    >
                      {Object.entries(SESSION_STYLE).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => {
                        setEditingSession(isEditing ? null : s.id)
                        if (!isEditing) setSessionNotes(prev => ({ ...prev, [s.id]: s.notes ?? '' }))
                      }}
                      className="text-zinc-500 hover:text-[#C8F135] transition-colors"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Supprimer la séance"
                      aria-label={`Supprimer la séance ${s.name}`}
                      onClick={() => deleteWorkoutSession(s.id)}
                      disabled={deletingSession === s.id}
                      className="rounded p-1 text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  {/* Inline note editor */}
                  {isEditing && (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={sessionNotes[s.id] ?? ''}
                        onChange={e => setSessionNotes(prev => ({ ...prev, [s.id]: e.target.value }))}
                        placeholder="Note sur la séance…"
                        rows={2}
                        className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingSession(null)} className="text-xs text-zinc-400 hover:text-white">Annuler</button>
                        <button
                          onClick={() => saveSessionNote(s.id)}
                          disabled={savingSession === s.id}
                          className="flex items-center gap-1 text-xs font-medium text-zinc-900 bg-[#C8F135] hover:bg-[#d4f54d] px-2 py-1 rounded disabled:opacity-50 transition-colors"
                        >
                          <Check className="size-3" /> Sauvegarder
                        </button>
                      </div>
                    </div>
                  )}

                  {s.notes && !isEditing && (
                    <p className="mt-1.5 text-xs text-zinc-500 italic ml-5">"{s.notes}"</p>
                  )}

                  <div className="mt-3 ml-5 space-y-1.5">
                    {(s.exerciseLogs?.length ?? 0) === 0 ? (
                      <p className="text-[11px] text-zinc-600 italic">Aucun exercice dans cette séance.</p>
                    ) : (
                      s.exerciseLogs?.map(log => (
                        <div
                          key={log.id}
                          className="flex items-center gap-2 rounded-md border border-zinc-700/70 bg-zinc-900/70 px-2 py-1.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-zinc-200">{log.exercise.name}</p>
                            <p className="text-[11px] text-zinc-500">
                              {log.sets ?? '—'} séries · {log.reps ?? '—'} reps
                              {log.weightKg ? ` · ${log.weightKg} kg` : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            title="Supprimer l'exercice"
                            aria-label={`Supprimer ${log.exercise.name}`}
                            onClick={() => deleteSessionExercise(s.id, log.id)}
                            disabled={deletingExercise === log.id}
                            className="rounded p-1 text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// Appointments tab: lists all appointments for this member with status badges, date, and a link to the appointments page.
function AppointmentsTab({ memberId }: { memberId: string }) {
  const [appts, setAppts]     = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow]         = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    fetch(`/api/coach/appointments?memberId=${memberId}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setAppts(d) })
      .finally(() => setLoading(false))
  }, [memberId])

  const upcoming = now ? appts.filter(a => new Date(a.scheduledAt) >= now && a.status !== 'CANCELLED') : []
  const past     = now ? appts.filter(a => new Date(a.scheduledAt) < now || a.status === 'CANCELLED' || a.status === 'COMPLETED') : []

  if (loading) return <div className="py-10 text-center text-sm text-zinc-500">Chargement…</div>

  if (appts.length === 0) return (
    <div className="py-10 text-center">
      <Calendar className="size-8 text-zinc-700 mx-auto mb-2" />
      <p className="text-sm text-zinc-500">Aucun rendez-vous avec ce membre</p>
    </div>
  )

  const ApptCard = ({ a }: { a: Appointment }) => {
    const st = STATUS_STYLE[a.status] ?? STATUS_STYLE.PENDING
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className={cn('size-2 rounded-full shrink-0', st.dot)} />
              <p className="text-sm font-medium text-white">{a.title}</p>
              <span className={cn('text-[10px] font-semibold', st.text)}>{st.label}</span>
            </div>
            <p className="text-xs text-zinc-400">
              {format(new Date(a.scheduledAt), "d MMM yyyy 'à' HH:mm", { locale: fr })} · {a.duration} min
            </p>
            {a.coachNote  && <p className="mt-2 text-xs text-zinc-300 italic">"{a.coachNote}"</p>}
            {a.memberNote && <p className="mt-1 text-xs text-zinc-500">Note membre : {a.memberNote}</p>}
          </div>
          {a.meetLink && (
            <a href={a.meetLink} target="_blank" rel="noreferrer"
              className="text-xs text-[#C8F135] hover:underline shrink-0">
              Rejoindre
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">À venir</p>
          {upcoming.map(a => <ApptCard key={a.id} a={a} />)}
        </div>
      )}
      {past.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Historique</p>
          {past.map(a => <ApptCard key={a.id} a={a} />)}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type Tab = 'overview' | 'notes' | 'activity' | 'appointments'

/** Coach members management page: sidebar member list with search, and a detail panel with Overview/Notes/Activity/Appointments tabs. */
export default function CoachMembers() {
  const [members, setMembers]               = useState<MemberItem[]>([])
  const [search, setSearch]                 = useState('')
  const [selectedId, setSelectedId]         = useState<string | null>(null)
  const [detail, setDetail]                 = useState<MemberDetail | null>(null)
  const [tab, setTab]                       = useState<Tab>('overview')
  const [listLoading, setListLoading]       = useState(true)
  const [detailLoading, setDetailLoading]   = useState(false)
  const [removing, setRemoving]             = useState(false)
  const [createOpen, setCreateOpen]         = useState(false)
  const [createSaving, setCreateSaving]     = useState(false)
  const [createError, setCreateError]       = useState<string | null>(null)
  const [createForm, setCreateForm]         = useState<CreateMemberForm>(emptyCreateMemberForm)

  const fetchMembers = useCallback(async () => {
    setListLoading(true)
    const res = await fetch('/api/coach/members').catch(() => null)
    const data = res ? await res.json().catch(() => []) : []
    setMembers(Array.isArray(data) ? data : [])
    setListLoading(false)
  }, [])

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true)
    const res = await fetch(`/api/coach/members/${id}`).catch(() => null)
    const data = res ? await res.json().catch(() => null) : null
    setDetail(data)
    setDetailLoading(false)
  }, [])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  const selectMember = (id: string) => {
    setSelectedId(id)
    setTab('overview')
    fetchDetail(id)
  }

  const removeMember = async () => {
    if (!selectedId || !confirm('Retirer ce membre de votre liste ?')) return
    setRemoving(true)
    try {
      const res = await fetch(`/api/coach/members/${selectedId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data?.error ?? 'Erreur lors de la suppression')
        return
      }
      setSelectedId(null)
      setDetail(null)
      await fetchMembers()
    } finally {
      setRemoving(false)
    }
  }

  const createMember = async () => {
    setCreateSaving(true)
    setCreateError(null)
    try {
      const toList = (value: string) => value.split(',').map(item => item.trim()).filter(Boolean)
      const res = await fetch('/api/coach/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'CREATE_MEMBER',
          ...createForm,
          dietaryRestrictions: toList(createForm.dietaryRestrictions),
          foodPreferences: toList(createForm.foodPreferences),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        const raw = data?.error
        const msg = typeof raw === 'string'
          ? raw
          : raw && typeof raw === 'object'
            ? Object.values(raw).flat().join(' · ')
            : 'Création impossible'
        setCreateError(msg)
        return
      }

      setCreateOpen(false)
      setCreateForm(emptyCreateMemberForm)
      await fetchMembers()
      const newId = data?.member?.id
      if (newId) selectMember(newId)
    } finally {
      setCreateSaving(false)
    }
  }

  const filtered = members.filter(m =>
    (m.member.name ?? m.member.email).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <CreateMemberModal
        open={createOpen}
        saving={createSaving}
        error={createError}
        form={createForm}
        setForm={setCreateForm}
        onClose={() => { setCreateOpen(false); setCreateError(null) }}
        onSubmit={createMember}
      />

      {/* ── Left panel ── */}
      <aside className="w-72 shrink-0 flex flex-col border-r border-zinc-800 bg-zinc-950">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Membres</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">{members.length}</span>
              <button
                onClick={() => setCreateOpen(true)}
                className="rounded-lg border border-zinc-700 p-1.5 text-zinc-400 transition-colors hover:border-[#C8F135]/50 hover:text-[#C8F135]"
                aria-label="Ajouter un client"
                title="Ajouter un client"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {listLoading ? (
            <div className="py-8 text-center text-xs text-zinc-500">Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center">
              <User className="size-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">
                {search ? 'Aucun résultat' : 'Aucun membre suivi'}
              </p>
            </div>
          ) : filtered.map(m => {
            const isSelected = m.member.id === selectedId
            return (
              <button
                key={m.member.id}
                onClick={() => selectMember(m.member.id)}
                className={cn(
                  'w-full text-left flex items-center gap-3 p-3 rounded-xl mb-1 transition-colors',
                  isSelected ? 'bg-[#C8F135]/10 border border-[#C8F135]/30' : 'hover:bg-zinc-900 border border-transparent',
                )}
              >
                <div className={cn(
                  'size-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  isSelected ? 'bg-[#C8F135] text-zinc-900' : 'bg-zinc-800 text-zinc-300',
                )}>
                  {initials(m.member.name, m.member.email)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{m.member.name ?? m.member.email}</p>
                  <p className="text-[10px] text-zinc-500 truncate">
                    {m.member.profile
                      ? `${GOAL_LABELS[m.member.profile.fitnessGoal] ?? m.member.profile.fitnessGoal}`
                      : 'Profil non renseigné'}
                  </p>
                </div>
                {isSelected && <ChevronRight className="size-3.5 text-[#C8F135] shrink-0" />}
              </button>
            )
          })}
        </div>
      </aside>

      {/* ── Right panel ── */}
      <main className="flex-1 overflow-y-auto bg-zinc-950">
        {!selectedId ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <User className="size-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">Sélectionnez un membre pour voir son espace de coaching</p>
            </div>
          </div>
        ) : detailLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="size-8 rounded-full border-2 border-zinc-700 border-t-[#C8F135] animate-spin" />
          </div>
        ) : detail ? (
          <div className="p-6 space-y-6">

            {/* ── Member header ── */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-full bg-[#C8F135]/10 flex items-center justify-center text-lg font-bold text-[#C8F135]">
                  {initials(detail.name, detail.email)}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{detail.name ?? detail.email}</h1>
                  <p className="text-sm text-zinc-400">{detail.email}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    Suivi depuis le {format(new Date(detail.assignedAt), 'd MMMM yyyy', { locale: fr })}
                    {detail.profile && ` · ${detail.profile.weightKg} kg · ${detail.profile.heightCm} cm`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/coach/appointments?memberId=${detail.id}`}
                  className="flex items-center gap-1.5 text-xs font-medium border border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-white px-3 py-2 rounded-lg transition-colors"
                >
                  <CalendarPlus className="size-3.5" /> Planifier RDV
                </a>
                <a
                  href={`mailto:${detail.email}`}
                  className="flex items-center gap-1.5 text-xs font-medium bg-[#C8F135] text-zinc-900 hover:bg-[#d4f54d] px-3 py-2 rounded-lg transition-colors"
                >
                  <Mail className="size-3.5" /> Contacter
                </a>
                <button
                  onClick={removeMember}
                  disabled={removing}
                  className="flex items-center gap-1.5 text-xs font-medium border border-red-800 text-red-400 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" />
                  {removing ? '…' : 'Retirer'}
                </button>
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              <TabBtn active={tab === 'overview'}     onClick={() => setTab('overview')}>Vue d'ensemble</TabBtn>
              <TabBtn active={tab === 'notes'}        onClick={() => setTab('notes')}>Notes</TabBtn>
              <TabBtn active={tab === 'activity'}     onClick={() => setTab('activity')}>Activité</TabBtn>
              <TabBtn active={tab === 'appointments'} onClick={() => setTab('appointments')}>Rendez-vous</TabBtn>
            </div>

            {/* ── Tab content ── */}
            <div>
              {tab === 'overview'     && <OverviewTab detail={detail} onRefresh={() => fetchDetail(detail.id)} />}
              {tab === 'notes'        && <NotesTab detail={detail} onRefresh={() => fetchDetail(detail.id)} />}
              {tab === 'activity'     && <ActivityTab detail={detail} memberId={detail.id} onRefresh={() => fetchDetail(detail.id)} />}
              {tab === 'appointments' && <AppointmentsTab memberId={detail.id} />}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-zinc-500">Membre introuvable</p>
          </div>
        )}
      </main>
    </div>
  )
}
