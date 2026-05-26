'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, X, Minus, Edit3, Save, MessageSquare, ClipboardEdit, Plus } from 'lucide-react'

// ─── Mock data ────────────────────────────────────────────────────────────────

const MEMBERS: Record<string, {
  name: string; since: string; lastSeen: string
  age: number; weight: number; height: number; bmi: number; tdee: number
  goal: string; level: string; equipment: string; days: number; restrictions: string
  program: { day: string; session: string }[]
  week: { day: string; date: string; session: string | null; status: 'done' | 'rest' | 'active' | 'planned' | 'missed'; kcal?: number; time?: number }[]
  tasks: { label: string; done: boolean }[]
  calories: number; protein: number; carbs: number; fat: number
  coachNotes: string; sharedNotes: string
}> = {
  m1: {
    name: 'Alex L.', since: '28 mai', lastSeen: '2 juin',
    age: 28, weight: 78.4, height: 178, bmi: 24.7, tdee: 2614,
    goal: 'Prise de masse', level: 'Intermédiaire', equipment: 'Salle de sport',
    days: 4, restrictions: 'Aucune',
    program: [
      { day: 'Lundi',    session: 'Push — Pectoraux' },
      { day: 'Mardi',    session: 'Pull — Dos' },
      { day: 'Jeudi',    session: 'Legs — Jambes' },
      { day: 'Vendredi', session: 'Full body' },
    ],
    week: [
      { day: 'Lundi',    date: '2 juin',  session: 'Push',  status: 'done',    kcal: 2914, time: 55 },
      { day: 'Mardi',    date: '3 juin',  session: 'Pull',  status: 'done',    kcal: 2780, time: 50 },
      { day: 'Mercredi', date: '4 juin',  session: null,    status: 'rest'  },
      { day: 'Jeudi',    date: '5 juin',  session: 'Legs',  status: 'active' },
      { day: 'Vendredi', date: '6 juin',  session: 'Full',  status: 'planned' },
      { day: 'Samedi',   date: '7 juin',  session: null,    status: 'rest'  },
      { day: 'Dimanche', date: '8 juin',  session: null,    status: 'rest'  },
    ],
    tasks: [
      { label: 'Boire 2L d\'eau',         done: true  },
      { label: 'Prendre sa créatine',      done: true  },
      { label: 'Séance Legs (planifiée)', done: false },
      { label: 'Saisir poids du jour',    done: false },
    ],
    calories: 2914, protein: 176, carbs: 370, fat: 80,
    coachNotes: 'Motivation élevée. Bonne connaissance des bases. A tendance à négliger le sommeil. Insister sur la récupération.',
    sharedNotes: '',
  },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Label({ children }: { children: ReactNode }) {
  return <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-3">{children}</p>
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl bg-zinc-900 border border-zinc-800 ${className}`}>
      {children}
    </div>
  )
}

const STATUS_STYLE = {
  done:    { dot: 'bg-emerald-400', text: 'text-emerald-400', badge: 'Complété',    bg: 'bg-emerald-400/8' },
  rest:    { dot: 'bg-zinc-600',    text: 'text-zinc-500',    badge: 'Repos actif', bg: '' },
  active:  { dot: 'bg-[#C8F135]',  text: 'text-[#C8F135]',  badge: 'En cours',    bg: 'bg-[#C8F135]/5' },
  planned: { dot: 'bg-zinc-600',    text: 'text-zinc-400',   badge: 'Planifié',    bg: '' },
  missed:  { dot: 'bg-red-400',     text: 'text-red-400',    badge: 'Manqué',      bg: 'bg-red-400/5' },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MemberDetail({ params }: { params: { memberId: string } }) {
  const member = MEMBERS[params.memberId]
  const [editing,     setEditing]     = useState(false)
  const [coachNotes,  setCoachNotes]  = useState(member?.coachNotes ?? '')
  const [sharedNotes, setSharedNotes] = useState(member?.sharedNotes ?? '')

  if (!member) {
    return (
      <div className="text-center py-20 text-zinc-400">
        Membre introuvable.{' '}
        <Link href="/coach/members" className="text-[#C8F135] hover:underline">Retour</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <Link href="/coach/members" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white mb-4 transition-colors">
          <ArrowLeft className="size-3.5" /> Retour aux membres
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Fiche client — {member.name}</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Entretien effectué le {member.since} · Suivi actif depuis le {member.lastSeen}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors">
              <MessageSquare className="size-3.5" /> Envoyer un message
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C8F135] text-zinc-900 text-xs font-bold hover:bg-[#d4f54d] transition-colors">
              <ClipboardEdit className="size-3.5" /> Modifier le plan
            </button>
          </div>
        </div>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── COL 1: PROFIL CLIENT ──────────────────────────────────────── */}
        <div className="space-y-4">
          <Card className="p-4">
            <Label>Profil client</Label>
            <div className="space-y-0">
              {[
                { k: 'Objectif',    v: member.goal,                  highlight: true },
                { k: 'Âge',         v: `${member.age} ans` },
                { k: 'Poids',       v: `${member.weight} kg` },
                { k: 'Taille',      v: `${member.height} cm` },
                { k: 'IMC',         v: `${member.bmi} — Normal` },
                { k: 'TDEE',        v: `${member.tdee.toLocaleString('fr-FR')} kcal` },
                { k: 'Niveau',      v: member.level },
                { k: 'Équipement',  v: member.equipment },
                { k: 'Jours dispo', v: `${member.days} / semaine` },
                { k: 'Restrictions',v: member.restrictions },
              ].map(r => (
                <div key={r.k} className="flex items-center justify-between py-2 border-b border-zinc-800/60 last:border-0">
                  <span className="text-xs text-zinc-500">{r.k}</span>
                  <span className={`text-xs font-semibold text-right ${r.highlight ? 'text-[#C8F135]' : 'text-zinc-200'}`}>
                    {r.v}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Notes coach privées */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Label>Notes coach (privées)</Label>
              {editing ? (
                <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-[10px] text-[#C8F135]">
                  <Save className="size-3" /> Enregistrer
                </button>
              ) : (
                <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-white">
                  <Edit3 className="size-3" /> Modifier
                </button>
              )}
            </div>
            {editing ? (
              <textarea value={coachNotes} onChange={e => setCoachNotes(e.target.value)} rows={4}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#C8F135] resize-none transition-colors" />
            ) : (
              <p className="text-xs text-zinc-400 leading-relaxed">{coachNotes || '—'}</p>
            )}
            <button className="mt-3 flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">
              <Plus className="size-3" /> Ajouter une note
            </button>
          </Card>
        </div>

        {/* ── COL 2: PROGRAMME + NUTRITION ─────────────────────────────── */}
        <div className="space-y-4">
          <Card className="p-4">
            <Label>Programme suggéré par l'IA</Label>
            <p className="text-xs text-zinc-400 mb-3 font-medium">PPL — Push / Pull / Legs</p>
            <div className="space-y-0 mb-4">
              {member.program.map(p => (
                <div key={p.day} className="flex items-center justify-between py-2 border-b border-zinc-800/60 last:border-0">
                  <span className="text-xs text-zinc-500 w-20 shrink-0">{p.day}</span>
                  <span className="text-xs text-zinc-200 font-medium">{p.session}</span>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
              <Edit3 className="size-3 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-amber-300 leading-snug">
                Modifiable par le coach — Clique sur un jour pour modifier les exercices, séries, répétitions et charges.
              </p>
            </div>
          </Card>

          <Card className="p-4">
            <Label>Plan nutrition suggéré</Label>
            <div className="mb-3">
              <p className="text-xs text-zinc-500 mb-0.5">Calories cibles</p>
              <p className="text-lg font-bold text-white">
                {member.calories.toLocaleString('fr-FR')} kcal
                <span className="text-xs text-[#C8F135] font-normal ml-1">(+300)</span>
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Protéines', value: member.protein, unit: 'g', color: 'text-[#C8F135]' },
                { label: 'Glucides',  value: member.carbs,   unit: 'g', color: 'text-blue-400' },
                { label: 'Lipides',   value: member.fat,     unit: 'g', color: 'text-pink-400' },
              ].map(m => (
                <div key={m.label} className="text-center p-2.5 rounded-lg bg-zinc-800/60 border border-zinc-700">
                  <p className={`text-base font-bold ${m.color}`}>{m.value}{m.unit}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── COL 3: CALENDRIER + TÂCHES ──────────────────────────────── */}
        <div className="space-y-4">
          <Card className="p-4">
            <Label>Calendrier de suivi</Label>
            <p className="text-xs text-zinc-500 mb-3">
              Semaine du {member.week[0].date} au {member.week[6].date}
            </p>
            <div className="space-y-1.5">
              {member.week.map(w => {
                const s = STATUS_STYLE[w.status]
                return (
                  <div key={w.day} className={`flex items-center justify-between px-3 py-2 rounded-lg ${s.bg}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`size-1.5 rounded-full shrink-0 ${s.dot}`} />
                      <div className="min-w-0">
                        <p className="text-xs text-zinc-300 font-medium truncate">
                          {w.day} {w.date}
                          {w.session && <span className="text-zinc-500 ml-1">· {w.session}</span>}
                        </p>
                        {w.time && (
                          <p className="text-[10px] text-zinc-600">
                            {w.time} min · {w.kcal?.toLocaleString('fr-FR')} kcal
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold shrink-0 ml-2 ${s.text}`}>
                      {s.badge}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="p-4">
            <Label>Tâches du jour assignées</Label>
            <div className="space-y-2">
              {member.tasks.map((t, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className={`size-4 rounded flex items-center justify-center shrink-0 ${
                    t.done ? 'bg-[#C8F135]/20 border border-[#C8F135]/40' : 'bg-zinc-800 border border-zinc-700'
                  }`}>
                    {t.done && <Check className="size-2.5 text-[#C8F135]" />}
                  </div>
                  <span className={`text-xs ${t.done ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                    {t.label}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
