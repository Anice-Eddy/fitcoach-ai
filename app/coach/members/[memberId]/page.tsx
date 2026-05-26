'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Target, Calendar, TrendingUp, Dumbbell,
  UtensilsCrossed, FileText, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Minus, Edit3, Save,
} from 'lucide-react'

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_MEMBERS: Record<string, {
  name: string; age: number; weight: number; height: number; goal: string
  activityLevel: string; fitnessLevel: string; equipment: string
  bmi: number; tdee: number; proteinG: number; carbsG: number; fatG: number
  restrictions: string[]; trainingDays: number; targetWeight: number
  sessions: { id: string; name: string; exercises: { name: string; sets: number; reps: string; rest: string }[] }[]
  weekCalendar: { day: string; session: string | null; status: 'done' | 'rest' | 'missed' | 'planned' }[]
  coachNotes: string; sharedNotes: string
}> = {
  m1: {
    name: 'Alice Martin', age: 28, weight: 62, height: 165, goal: 'Prise de masse',
    activityLevel: 'Modérément actif', fitnessLevel: 'Intermédiaire', equipment: 'Salle de sport',
    bmi: 22.8, tdee: 2200, proteinG: 155, carbsG: 280, fatG: 65,
    restrictions: ['Sans gluten'], trainingDays: 4, targetWeight: 68,
    sessions: [
      {
        id: 's1', name: 'Push — Pectoraux / Épaules / Triceps',
        exercises: [
          { name: 'Développé couché barre',    sets: 4, reps: '6–8',   rest: '3 min' },
          { name: 'Développé incliné haltères', sets: 3, reps: '8–10',  rest: '2 min' },
          { name: 'Élévations latérales',       sets: 3, reps: '12–15', rest: '90 s'  },
          { name: 'Extensions triceps poulie',  sets: 3, reps: '12–15', rest: '90 s'  },
        ],
      },
      {
        id: 's2', name: 'Pull — Dos / Biceps',
        exercises: [
          { name: 'Tractions pronation',        sets: 4, reps: '6–8',   rest: '3 min' },
          { name: 'Rowing barre',               sets: 3, reps: '8–10',  rest: '2 min' },
          { name: 'Curl haltères alternés',     sets: 3, reps: '10–12', rest: '90 s'  },
        ],
      },
      {
        id: 's3', name: 'Legs — Quadriceps / Ischio / Fessiers',
        exercises: [
          { name: 'Squat barre',                sets: 4, reps: '6–8',   rest: '3 min' },
          { name: 'Presse à cuisses',           sets: 3, reps: '10–12', rest: '2 min' },
          { name: 'Leg curl assis',             sets: 3, reps: '12–15', rest: '90 s'  },
          { name: 'Hip thrust',                 sets: 3, reps: '12–15', rest: '90 s'  },
        ],
      },
    ],
    weekCalendar: [
      { day: 'Lun', session: 'Push', status: 'done' },
      { day: 'Mar', session: null,   status: 'rest' },
      { day: 'Mer', session: 'Pull', status: 'done' },
      { day: 'Jeu', session: null,   status: 'rest' },
      { day: 'Ven', session: 'Legs', status: 'planned' },
      { day: 'Sam', session: 'Push', status: 'planned' },
      { day: 'Dim', session: null,   status: 'rest' },
    ],
    coachNotes: 'Alice a du mal avec les tractions — suggérer bandes de résistance pour assistance.',
    sharedNotes: 'Augmenter les charges au développé couché la semaine prochaine.',
  },
}

// ─── Status helpers ──────────────────────────────────────────────────────────

const DAY_STATUS: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  done:    { icon: CheckCircle2, color: 'text-emerald-400', label: 'Complété' },
  rest:    { icon: Minus,        color: 'text-zinc-500',    label: 'Repos' },
  missed:  { icon: XCircle,      color: 'text-red-400',     label: 'Manqué' },
  planned: { icon: Calendar,     color: 'text-[#C8F135]',   label: 'Planifié' },
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: typeof Dumbbell; children: ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 border-b border-zinc-800"
      >
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-[#C8F135]" />
          <h2 className="text-sm font-semibold text-zinc-300">{title}</h2>
        </div>
        {open ? <ChevronUp className="size-4 text-zinc-500" /> : <ChevronDown className="size-4 text-zinc-500" />}
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MemberDetail({ params }: { params: { memberId: string } }) {
  const member = MOCK_MEMBERS[params.memberId]
  const [editingNotes, setEditingNotes] = useState(false)
  const [coachNotes,   setCoachNotes]   = useState(member?.coachNotes ?? '')
  const [sharedNotes,  setSharedNotes]  = useState(member?.sharedNotes ?? '')

  if (!member) {
    return (
      <div className="text-center py-20 text-zinc-400">
        Membre introuvable.{' '}
        <Link href="/coach/members" className="text-[#C8F135] hover:underline">Retour</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl pb-10">
      <Link href="/coach/members" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft className="size-4" /> Retour aux membres
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="size-14 rounded-xl bg-zinc-800 flex items-center justify-center text-xl font-bold text-zinc-400 shrink-0">
          {member.name[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{member.name}</h1>
          <p className="text-sm text-zinc-400 mt-0.5">{member.goal} · {member.fitnessLevel}</p>
        </div>
      </div>

      {/* Profil physique */}
      <Section title="Profil complet" icon={Target}>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Âge',          value: `${member.age} ans` },
            { label: 'Poids',        value: `${member.weight} kg` },
            { label: 'Taille',       value: `${member.height} cm` },
            { label: 'IMC',          value: member.bmi.toFixed(1) },
            { label: 'TDEE',         value: `${member.tdee} kcal` },
            { label: 'Protéines',    value: `${member.proteinG}g` },
            { label: 'Glucides',     value: `${member.carbsG}g` },
            { label: 'Lipides',      value: `${member.fatG}g` },
            { label: 'Niveau',       value: member.fitnessLevel },
            { label: 'Activité',     value: member.activityLevel },
            { label: 'Jours/sem.',   value: `${member.trainingDays} j` },
            { label: 'Équipement',   value: member.equipment },
            { label: 'Poids cible',  value: `${member.targetWeight} kg` },
            { label: 'Restrictions', value: member.restrictions.join(', ') || 'Aucune' },
          ].map(r => (
            <div key={r.label} className="rounded-xl bg-zinc-800/60 border border-zinc-700 p-3">
              <p className="text-xs text-zinc-500 mb-0.5">{r.label}</p>
              <p className="text-sm font-semibold text-white">{r.value}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Programme IA */}
      <Section title="Programme suggéré par l'IA" icon={Dumbbell}>
        <div className="space-y-4">
          {member.sessions.map(session => (
            <div key={session.id} className="rounded-xl bg-zinc-800/60 border border-zinc-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-700 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">{session.name}</h3>
                <button className="text-xs text-zinc-500 hover:text-[#C8F135] flex items-center gap-1 transition-colors">
                  <Edit3 className="size-3" /> Modifier
                </button>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="px-4 py-2 text-left text-zinc-500 font-medium">Exercice</th>
                    <th className="px-3 py-2 text-center text-zinc-500 font-medium">Séries</th>
                    <th className="px-3 py-2 text-center text-zinc-500 font-medium">Reps</th>
                    <th className="px-3 py-2 text-center text-zinc-500 font-medium">Repos</th>
                  </tr>
                </thead>
                <tbody>
                  {session.exercises.map((ex, i) => (
                    <tr key={i} className="border-b border-zinc-700/50 last:border-0">
                      <td className="px-4 py-2.5 text-zinc-300">{ex.name}</td>
                      <td className="px-3 py-2.5 text-center text-zinc-400">{ex.sets}</td>
                      <td className="px-3 py-2.5 text-center text-zinc-400">{ex.reps}</td>
                      <td className="px-3 py-2.5 text-center text-zinc-400">{ex.rest}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </Section>

      {/* Nutrition */}
      <Section title="Plan nutrition" icon={UtensilsCrossed} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Calories cibles', value: `${member.tdee} kcal/j`, highlight: true },
            { label: 'Protéines',       value: `${member.proteinG}g/j` },
            { label: 'Glucides',        value: `${member.carbsG}g/j` },
            { label: 'Lipides',         value: `${member.fatG}g/j` },
          ].map(r => (
            <div key={r.label} className={`rounded-xl p-3 border ${r.highlight ? 'bg-[#C8F135]/5 border-[#C8F135]/20' : 'bg-zinc-800/60 border-zinc-700'}`}>
              <p className="text-xs text-zinc-500 mb-0.5">{r.label}</p>
              <p className={`text-sm font-bold ${r.highlight ? 'text-[#C8F135]' : 'text-white'}`}>{r.value}</p>
            </div>
          ))}
        </div>
        {member.restrictions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {member.restrictions.map(r => (
              <span key={r} className="px-2.5 py-1 rounded-lg bg-red-400/10 border border-red-400/20 text-xs text-red-400">{r}</span>
            ))}
          </div>
        )}
      </Section>

      {/* Calendrier semaine */}
      <Section title="Suivi de la semaine" icon={Calendar}>
        <div className="grid grid-cols-7 gap-1.5">
          {member.weekCalendar.map(({ day, session, status }) => {
            const cfg = DAY_STATUS[status]
            const Icon = cfg.icon
            return (
              <div key={day} className="flex flex-col items-center gap-1.5">
                <span className="text-xs text-zinc-500">{day}</span>
                <div className={`w-full aspect-square rounded-xl flex items-center justify-center ${
                  status === 'done'    ? 'bg-emerald-400/10 border border-emerald-400/20' :
                  status === 'planned' ? 'bg-[#C8F135]/10 border border-[#C8F135]/20' :
                  status === 'missed'  ? 'bg-red-400/10 border border-red-400/20' :
                  'bg-zinc-800 border border-zinc-700'
                }`}>
                  <Icon className={`size-4 ${cfg.color}`} />
                </div>
                {session && <span className="text-[10px] text-zinc-500 text-center leading-tight">{session}</span>}
              </div>
            )
          })}
        </div>
      </Section>

      {/* Notes */}
      <Section title="Notes coach" icon={FileText}>
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-zinc-500">Gérer les notes ci-dessous</p>
            {editingNotes ? (
              <button onClick={() => setEditingNotes(false)}
                className="flex items-center gap-1.5 text-xs text-[#C8F135] hover:text-white transition-colors">
                <Save className="size-3.5" /> Enregistrer
              </button>
            ) : (
              <button onClick={() => setEditingNotes(true)}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
                <Edit3 className="size-3.5" /> Modifier
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">
              Notes privées <span className="text-zinc-700">(invisibles du client)</span>
            </label>
            {editingNotes ? (
              <textarea value={coachNotes} onChange={e => setCoachNotes(e.target.value)} rows={3}
                className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#C8F135] transition-colors resize-none" />
            ) : (
              <p className="text-sm text-zinc-300 p-3 rounded-xl bg-zinc-800/60 border border-zinc-700">{coachNotes || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">
              Notes partagées <span className="text-zinc-700">(visibles du client)</span>
            </label>
            {editingNotes ? (
              <textarea value={sharedNotes} onChange={e => setSharedNotes(e.target.value)} rows={3}
                className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#C8F135] transition-colors resize-none" />
            ) : (
              <p className="text-sm text-zinc-300 p-3 rounded-xl bg-zinc-800/60 border border-zinc-700">{sharedNotes || '—'}</p>
            )}
          </div>
        </div>
      </Section>
    </div>
  )
}
