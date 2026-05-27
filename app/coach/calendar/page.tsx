'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AvailabilityRule {
  id:           string
  dayOfWeek:    number
  startHour:    number
  startMinute:  number
  endHour:      number
  endMinute:    number
  slotDuration: number
}

interface Appointment {
  id:          string
  title:       string
  scheduledAt: string
  duration:    number
  status:      string
  member:      { id: string; name: string | null; email: string }
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const DAY_FULL  = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const HOURS     = Array.from({ length: 14 }, (_, i) => i + 7)  // 7h → 20h

const STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-amber-500/20   border-amber-500/40   text-amber-300',
  PROPOSED:  'bg-blue-500/20    border-blue-500/40    text-blue-300',
  CONFIRMED: 'bg-[#C8F135]/20   border-[#C8F135]/40   text-[#C8F135]',
  COMPLETED: 'bg-zinc-700       border-zinc-600        text-zinc-400',
  CANCELLED: 'bg-red-500/20     border-red-500/40     text-red-300',
  NO_SHOW:   'bg-red-500/20     border-red-500/40     text-red-300',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d
  })
}

function isoDay(date: Date): number {
  const d = date.getDay()
  return d === 0 ? 7 : d
}

function fmtTime(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function fmtDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function initials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(' ')
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function isHourAvailable(day: Date, hour: number, rules: AvailabilityRule[]): boolean {
  const iso = isoDay(day)
  return rules.some(r => {
    if (r.dayOfWeek !== iso) return false
    const rStart = r.startHour * 60 + r.startMinute
    const rEnd   = r.endHour   * 60 + r.endMinute
    return hour * 60 >= rStart && (hour + 1) * 60 <= rEnd
  })
}

function getAppointmentAtHour(day: Date, hour: number, apts: Appointment[]): Appointment | null {
  return apts.find(apt => {
    const d = new Date(apt.scheduledAt)
    return d.toDateString() === day.toDateString() && d.getHours() === hour
  }) ?? null
}

// ─── Add rule panel ───────────────────────────────────────────────────────────

function AddRulePanel({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    dayOfWeek:    1,
    startHour:    9,
    startMinute:  0,
    endHour:      18,
    endMinute:    0,
    slotDuration: 60,
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/coach/availability', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Erreur')
        return
      }
      onSave()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const labelCls = 'text-xs text-zinc-500 mb-1 block'
  const selectCls = 'w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-2 text-sm text-white outline-none focus:border-[#C8F135]'

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Nouvelle disponibilité</p>
        <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="size-4" /></button>
      </div>

      <div>
        <label className={labelCls}>Jour</label>
        <select className={selectCls} value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: +e.target.value }))}>
          {DAY_FULL.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Début</label>
          <select className={selectCls} value={form.startHour * 60 + form.startMinute}
            onChange={e => { const v = +e.target.value; setForm(f => ({ ...f, startHour: Math.floor(v / 60), startMinute: v % 60 })) }}>
            {Array.from({ length: 28 }, (_, i) => {
              const h = Math.floor(i / 2) + 7; const m = (i % 2) * 30
              return <option key={i} value={h * 60 + m}>{fmtTime(h, m)}</option>
            })}
          </select>
        </div>
        <div>
          <label className={labelCls}>Fin</label>
          <select className={selectCls} value={form.endHour * 60 + form.endMinute}
            onChange={e => { const v = +e.target.value; setForm(f => ({ ...f, endHour: Math.floor(v / 60), endMinute: v % 60 })) }}>
            {Array.from({ length: 28 }, (_, i) => {
              const h = Math.floor(i / 2) + 7; const m = (i % 2) * 30
              return <option key={i} value={h * 60 + m}>{fmtTime(h, m)}</option>
            })}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Durée d'un créneau</label>
        <select className={selectCls} value={form.slotDuration} onChange={e => setForm(f => ({ ...f, slotDuration: +e.target.value }))}>
          <option value={30}>30 min</option>
          <option value={45}>45 min</option>
          <option value={60}>1h</option>
          <option value={90}>1h30</option>
          <option value={120}>2h</option>
        </select>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        onClick={save}
        disabled={saving}
        className="w-full rounded-xl bg-[#C8F135] px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-[#d4f54d] disabled:opacity-50 transition-colors"
      >
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

/** Coach calendar page: weekly grid showing availability blocks and appointments, with a right panel to manage recurring availability rules. */
export default function CoachCalendarPage() {
  const [monday,       setMonday]       = useState<Date>(() => getMonday(new Date()))
  const [rules,        setRules]        = useState<AvailabilityRule[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [showAdd,      setShowAdd]      = useState(false)
  const [deletingId,   setDeletingId]   = useState<string | null>(null)

  const days = getWeekDays(monday)

  const fetchRules = useCallback(async () => {
    const res = await fetch('/api/coach/availability')
    if (res.ok) setRules(await res.json())
  }, [])

  const fetchAppointments = useCallback(async () => {
    const from = monday.toISOString().slice(0, 10)
    const to   = new Date(monday.getTime() + 6 * 86_400_000).toISOString().slice(0, 10)
    const res  = await fetch(`/api/coach/appointments?from=${from}&to=${to}`)
    if (res.ok) setAppointments(await res.json())
  }, [monday])

  useEffect(() => { fetchRules() }, [fetchRules])
  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  const prevWeek = () => setMonday(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })
  const nextWeek = () => setMonday(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })

  const deleteRule = async (id: string) => {
    setDeletingId(id)
    await fetch(`/api/coach/availability/${id}`, { method: 'DELETE' })
    setDeletingId(null)
    fetchRules()
  }

  const todayStr = new Date().toDateString()
  const weekEnd  = days[6]
  const weekLabel = `${fmtDate(days[0])} – ${fmtDate(weekEnd)} ${weekEnd.getFullYear()}`

  return (
    <div className="flex gap-5 min-h-0">

      {/* ── Calendar grid (left) ─────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Week navigation */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Calendrier</h1>
          <div className="flex items-center gap-3">
            <button onClick={prevWeek} className="rounded-lg border border-zinc-700 p-2 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm text-zinc-300 min-w-44 text-center">{weekLabel}</span>
            <button onClick={nextWeek} className="rounded-lg border border-zinc-700 p-2 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="w-12 py-3 text-zinc-600 font-normal" />
                {days.map((day, i) => (
                  <th key={i} className={cn(
                    'py-3 px-2 font-medium text-center border-l border-zinc-800',
                    day.toDateString() === todayStr ? 'text-[#C8F135]' : 'text-zinc-400',
                  )}>
                    <span className="block">{DAY_NAMES[i]}</span>
                    <span className={cn(
                      'mt-0.5 flex size-6 items-center justify-center rounded-full text-sm font-bold mx-auto',
                      day.toDateString() === todayStr ? 'bg-[#C8F135] text-zinc-950' : '',
                    )}>
                      {day.getDate()}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour} className="border-b border-zinc-800/50">
                  <td className="py-1 pr-3 text-right text-[11px] text-zinc-600 font-mono align-top pt-2">
                    {fmtTime(hour, 0)}
                  </td>
                  {days.map((day, di) => {
                    const available = isHourAvailable(day, hour, rules)
                    const apt       = getAppointmentAtHour(day, hour, appointments)
                    return (
                      <td
                        key={di}
                        className={cn(
                          'border-l border-zinc-800/50 h-12 px-1 py-0.5 align-top relative',
                          available && !apt ? 'bg-[#C8F135]/5' : '',
                        )}
                      >
                        {apt ? (
                          <div className={cn(
                            'rounded-md border px-1.5 py-1 text-[10px] leading-tight cursor-default h-full',
                            STATUS_COLORS[apt.status] ?? STATUS_COLORS.PENDING,
                          )}>
                            <span className="font-semibold block truncate">
                              {initials(apt.member.name, apt.member.email)}
                            </span>
                            <span className="opacity-70 truncate block">{apt.title.slice(0, 18)}</span>
                          </div>
                        ) : available ? (
                          <div className="h-full rounded-md border border-[#C8F135]/10 border-dashed" />
                        ) : null}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded border border-dashed border-[#C8F135]/40 bg-[#C8F135]/5" />
            Disponible
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded border border-[#C8F135]/40 bg-[#C8F135]/20" />
            Confirmé
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded border border-amber-500/40 bg-amber-500/20" />
            En attente
          </div>
        </div>
      </div>

      {/* ── Right panel ──────────────────────────────────────────── */}
      <div className="w-72 shrink-0 space-y-4">

        {/* Availability rules */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Disponibilités</h2>
            <button
              onClick={() => setShowAdd(v => !v)}
              className="flex items-center gap-1 rounded-lg bg-[#C8F135]/10 px-2.5 py-1.5 text-xs font-medium text-[#C8F135] hover:bg-[#C8F135]/20 transition-colors"
            >
              <Plus className="size-3" /> Ajouter
            </button>
          </div>

          {showAdd && (
            <AddRulePanel
              onSave={fetchRules}
              onClose={() => setShowAdd(false)}
            />
          )}

          {rules.length === 0 && !showAdd ? (
            <p className="text-xs text-zinc-500 py-2">Aucune disponibilité définie. Ajoutez vos créneaux pour que vos membres puissent réserver.</p>
          ) : (
            <div className="space-y-2">
              {rules.map(rule => (
                <div key={rule.id} className="flex items-center justify-between rounded-xl border border-zinc-800 px-3 py-2.5">
                  <div>
                    <p className="text-xs font-semibold text-white">{DAY_FULL[rule.dayOfWeek - 1]}</p>
                    <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                      <Clock className="size-2.5" />
                      {fmtTime(rule.startHour, rule.startMinute)} → {fmtTime(rule.endHour, rule.endMinute)}
                      <span className="ml-1 text-zinc-600">· {rule.slotDuration}min</span>
                    </p>
                  </div>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    disabled={deletingId === rule.id}
                    className="text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* This week's appointments */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-white">RDV cette semaine</h2>
          {appointments.length === 0 ? (
            <p className="text-xs text-zinc-500">Aucun rendez-vous cette semaine.</p>
          ) : (
            <div className="space-y-2">
              {appointments
                .filter(a => ['PENDING', 'PROPOSED', 'CONFIRMED'].includes(a.status))
                .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                .map(apt => {
                  const d = new Date(apt.scheduledAt)
                  return (
                    <div key={apt.id} className={cn('rounded-xl border px-3 py-2.5 text-xs', STATUS_COLORS[apt.status] ?? STATUS_COLORS.PENDING)}>
                      <p className="font-semibold truncate">{apt.member.name ?? apt.member.email}</p>
                      <p className="opacity-70 mt-0.5">
                        {DAY_NAMES[isoDay(d) - 1]} {fmtDate(d)} · {fmtTime(d.getHours(), d.getMinutes())}
                      </p>
                      <p className="opacity-60 truncate mt-0.5">{apt.title}</p>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
