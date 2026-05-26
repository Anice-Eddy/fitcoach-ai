'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Edit3, Save, MessageSquare, ClipboardEdit, Plus } from 'lucide-react'

// Mock data.

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
      { day: 'Lundi',    session: 'Haut du corps — Pectoraux' },
      { day: 'Mardi',    session: 'Haut du corps — Dos' },
      { day: 'Jeudi',    session: 'Jambes — Fessiers' },
      { day: 'Vendredi', session: 'Corps complet' },
    ],
    week: [
      { day: 'Lundi',    date: '2 juin',  session: 'Pectoraux', status: 'done',    kcal: 2914, time: 55 },
      { day: 'Mardi',    date: '3 juin',  session: 'Dos',       status: 'done',    kcal: 2780, time: 50 },
      { day: 'Mercredi', date: '4 juin',  session: null,    status: 'rest'  },
      { day: 'Jeudi',    date: '5 juin',  session: 'Jambes', status: 'active' },
      { day: 'Vendredi', date: '6 juin',  session: 'Complet', status: 'planned' },
      { day: 'Samedi',   date: '7 juin',  session: null,    status: 'rest'  },
      { day: 'Dimanche', date: '8 juin',  session: null,    status: 'rest'  },
    ],
    tasks: [
      { label: 'Boire 2L d\'eau',         done: true  },
      { label: 'Prendre sa créatine',      done: true  },
      { label: 'Séance jambes planifiée', done: false },
      { label: 'Saisir poids du jour',    done: false },
    ],
    calories: 2914, protein: 176, carbs: 370, fat: 80,
    coachNotes: 'Motivation élevée. Bonne connaissance des bases. A tendance à négliger le sommeil. Insister sur la récupération.',
    sharedNotes: '',
  },
}

// Sub-components.

function Label({ children }: { children: ReactNode }) {
  return <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-3">{children}</p>
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-zinc-700 bg-[#1a1d17] ${className}`}>
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

// Page component.

export default function MemberDetail({ params }: { params: { memberId: string } }) {
  const member = MEMBERS[params.memberId]
  const [editing,     setEditing]     = useState(false)
  const [coachNotes,  setCoachNotes]  = useState(member?.coachNotes ?? '')

  if (!member) {
    return (
      <div className="text-center py-20 text-zinc-400">
        Membre introuvable.{' '}
        <Link href="/coach/members" className="text-[#C8F135] hover:underline">Retour</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <section className="rounded-lg bg-[#0b0d09] p-8">
      {/* Header */}
      <div className="border-b border-zinc-700 pb-6">
        <Link href="/coach/members" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white mb-4 transition-colors">
          <ArrowLeft className="size-3.5" /> Retour aux membres
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-medium text-white">Fiche client — {member.name}</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Entretien effectué le {member.since} · Suivi actif depuis le {member.lastSeen}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button" aria-label="Envoyer un message au client" className="flex items-center gap-1.5 rounded-full border border-zinc-700 px-6 py-2 text-xs text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white disabled:opacity-50">
              <MessageSquare className="size-3.5" /> Envoyer un message
            </button>
            <button type="button" aria-label="Modifier le plan du client" className="flex items-center gap-1.5 rounded-full bg-[#C8F135] px-6 py-2 text-xs font-medium text-black transition-colors hover:bg-[#d4f54d] disabled:opacity-50">
              <ClipboardEdit className="size-3.5" /> Modifier le plan
            </button>
          </div>
        </div>
      </div>

      {/* Three-column grid */}
      <div className="mt-7 grid grid-cols-1 gap-7 lg:grid-cols-3">

        {/* Column 1: client profile */}
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
                { k: 'Calories/jour', v: `${member.tdee.toLocaleString('fr-FR')} kcal` },
                { k: 'Niveau',      v: member.level },
                { k: 'Équipement',  v: member.equipment },
                { k: 'Jours dispo', v: `${member.days} / semaine` },
                { k: 'Restrictions',v: member.restrictions },
              ].map(r => (
                <div key={r.k} className="flex items-center justify-between py-2 border-b border-zinc-800/60 last:border-0">
                  <span className="text-xs text-zinc-500">{r.k}</span>
                  <span className={`text-right font-mono text-xs font-medium ${r.highlight ? 'text-[#C8F135]' : 'text-white'}`}>
                    {r.v}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Private coach notes */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Label>Notes coach (privées)</Label>
              {editing ? (
                <button type="button" aria-label="Enregistrer la note privée" onClick={() => setEditing(false)} className="flex items-center gap-1 text-[10px] text-[#C8F135] hover:text-[#d4f54d]">
                  <Save className="size-3" /> Enregistrer
                </button>
              ) : (
                <button type="button" aria-label="Modifier la note privée" onClick={() => setEditing(true)} className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-white">
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
            <button type="button" aria-label="Ajouter une note coach" className="mt-3 flex items-center gap-1 border-t border-zinc-700 pt-4 text-[10px] text-zinc-600 transition-colors hover:text-zinc-400">
              <Plus className="size-3" /> Ajouter une note
            </button>
          </Card>
        </div>

        {/* Column 2: program and nutrition */}
        <div className="space-y-4">
          <Card className="p-4">
            <Label>Programme suggéré par l'IA</Label>
            <p className="mb-3 text-sm font-medium text-[#C8F135]">Haut du corps / Dos / Jambes</p>
            <div className="mb-4 space-y-1.5">
              {member.program.map(p => (
                <div key={p.day} className="flex items-center justify-between rounded-lg bg-[#0b0d09] px-4 py-2">
                  <span className="w-20 shrink-0 text-xs font-medium text-white">{p.day}</span>
                  <span className="text-xs font-medium text-zinc-400">{p.session}</span>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-[#C8F135]/30 bg-[#C8F135]/5 p-3">
              <Edit3 className="size-3 text-[#C8F135] mt-0.5 shrink-0" />
              <p className="text-[11px] leading-snug text-zinc-400">
                <span className="font-medium text-[#C8F135]">Modifiable par le coach</span> — Clique sur un jour pour modifier les exercices, séries, répétitions et charges.
              </p>
            </div>
          </Card>

          <Card className="p-4">
            <Label>Plan nutrition suggéré</Label>
            <div className="mb-3">
              <p className="text-xs text-zinc-500 mb-0.5">Calories cibles</p>
              <p className="font-mono text-lg font-medium text-white">
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
                  <p className={`font-mono text-base font-medium ${m.color}`}>{m.value}{m.unit}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Column 3: calendar and tasks */}
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
                  <div key={w.day} className={`flex items-center justify-between rounded-lg bg-[#0b0d09] px-3 py-2 ${s.bg}`}>
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
                <button key={i} type="button" aria-label={`Tâche ${t.label}`} className="flex w-full items-center gap-2.5 text-left">
                  <div className={`size-4 rounded flex items-center justify-center shrink-0 ${
                    t.done ? 'bg-[#C8F135]/20 border border-[#C8F135]/40' : 'bg-zinc-800 border border-zinc-700'
                  }`}>
                    {t.done && <Check className="size-2.5 text-[#C8F135]" />}
                  </div>
                  <span className={`text-xs ${t.done ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
      </section>
    </div>
  )
}
