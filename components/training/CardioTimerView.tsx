'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Play, Pause, RotateCcw, Flame,
  Timer, Ruler, Wind, MoveUp, Activity,
} from 'lucide-react'
import type { SessionExercise } from '@/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function playBeep() {
  try {
    const ctx  = new AudioContext()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(); osc.stop(ctx.currentTime + 0.4)
    osc.onended = () => ctx.close()
  } catch {}
}

// Calories estimées selon vitesse (METs simplifiés)
function estimateCalories(durationMin: number, speedKmH: number): number {
  const met = speedKmH > 12 ? 11 : speedKmH > 8 ? 8 : speedKmH > 4 ? 6 : 5
  return Math.round(durationMin * met * 70 / 60) // poids référence 70 kg
}

// Pace min/km si vitesse > 0
function pace(speedKmH: number): string | null {
  if (speedKmH <= 0) return null
  const totalSec = Math.round(3600 / speedKmH)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')} /km`
}

// ── Stepper inline ───────────────────────────────────────────────────────────
function Stepper({
  label, value, unit, step = 1, min = 0, max, onChange,
}: {
  label: string; value: number; unit?: string; step?: number; min?: number; max?: number
  onChange: (v: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState('')

  const commit = () => {
    const n = parseFloat(draft.replace(',', '.'))
    if (!isNaN(n)) {
      let v = n
      if (min !== undefined) v = Math.max(min, v)
      if (max !== undefined) v = Math.min(max, v)
      onChange(+v.toFixed(2))
    }
    setEditing(false)
  }

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3.5">
      <label className="block text-[10px] text-zinc-500 mb-1.5 uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => onChange(Math.max(min ?? 0, +(value - step).toFixed(2)))}
          className="size-8 rounded-lg bg-zinc-800 text-white text-lg font-bold hover:bg-zinc-700 shrink-0 active:scale-95 transition-transform">−</button>
        {editing ? (
          <input autoFocus type="number" inputMode="decimal" value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit} onKeyDown={e => e.key === 'Enter' && commit()}
            className="flex-1 text-center text-lg font-bold text-white bg-zinc-800 rounded-lg py-0.5 outline-none focus:ring-2 focus:ring-[#C8F135] tabular-nums" />
        ) : (
          <button type="button" onClick={() => { setDraft(String(value)); setEditing(true) }}
            className="flex-1 text-center text-lg font-bold text-white hover:text-[#C8F135] transition-colors tabular-nums py-0.5"
            title="Appuyer pour saisir">
            {value}{unit && <span className="text-xs text-zinc-500 ml-0.5">{unit}</span>}
          </button>
        )}
        <button type="button" onClick={() => onChange(Math.min(max ?? Infinity, +(value + step).toFixed(2)))}
          className="size-8 rounded-lg bg-zinc-800 text-white text-lg font-bold hover:bg-zinc-700 shrink-0 active:scale-95 transition-transform">+</button>
      </div>
    </div>
  )
}

// Exercices HIIT/bodyweight : pas de distance/vitesse/pente
const HIIT_IDS = new Set([
  'ex-hiit', 'ex-burpee', 'ex-mountain-climber', 'ex-jump-rope',
  'ex-jump-squat', 'ex-box-jump', 'ex-thruster',
])

function isHIITExercise(exercise: SessionExercise): boolean {
  return HIIT_IDS.has(exercise.id) ||
    (!exercise.equipment.includes('CARDIO_MACHINE') && exercise.muscleGroups[0] === 'CARDIO')
}

// ── Props ────────────────────────────────────────────────────────────────────
interface Props {
  exercise:       SessionExercise
  isCompleted:    boolean
  onCardioChange: (fields: Partial<Pick<SessionExercise, 'durationMinutes' | 'distanceKm' | 'speedKmH' | 'inclinePct'>>) => void
  onComplete:     () => void
}

// ── Main component ────────────────────────────────────────────────────────────
export function CardioTimerView({ exercise, isCompleted, onCardioChange, onComplete }: Props) {
  const isHIIT = isHIITExercise(exercise)

  // Paramètres locaux — ne resetent pas le timer quand une valeur change
  const [dur,   setDur]   = useState(exercise.durationMinutes ?? (isHIIT ? 20 : 30))
  const [dist,  setDist]  = useState(exercise.distanceKm     ?? 0)
  const [speed, setSpeed] = useState(exercise.speedKmH        ?? 0)
  const [incl,  setIncl]  = useState(exercise.inclinePct      ?? 0)

  // Timer
  const [mode,    setMode]    = useState<'minuteur' | 'chrono'>('minuteur')
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0) // secondes écoulées depuis start
  const [done,    setDone]    = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const targetSec = dur * 60
  const remaining = Math.max(0, targetSec - elapsed)
  const displaySec = mode === 'chrono' ? elapsed : remaining
  const pct = mode === 'minuteur' && targetSec > 0 ? Math.min(1, elapsed / targetSec) : 0

  // Sync params → store sans affecter le timer
  const updateParam = useCallback((fields: Partial<Pick<SessionExercise, 'durationMinutes' | 'distanceKm' | 'speedKmH' | 'inclinePct'>>) => {
    if (fields.durationMinutes !== undefined) setDur(fields.durationMinutes)
    if (fields.distanceKm      !== undefined) setDist(fields.distanceKm)
    if (fields.speedKmH        !== undefined) setSpeed(fields.speedKmH)
    if (fields.inclinePct      !== undefined) setIncl(fields.inclinePct)
    onCardioChange(fields)
  }, [onCardioChange])

  // Auto-stop minuteur à 0
  useEffect(() => {
    if (mode === 'minuteur' && running && remaining === 0) {
      clearInterval(intervalRef.current!)
      setRunning(false)
      setDone(true)
      playBeep()
    }
  }, [remaining, running, mode])

  const startTimer = () => {
    if (running) return
    setRunning(true)
    setDone(false)
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
  }

  const pauseTimer = () => {
    clearInterval(intervalRef.current!)
    setRunning(false)
  }

  const resetTimer = () => {
    clearInterval(intervalRef.current!)
    setRunning(false)
    setElapsed(0)
    setDone(false)
  }

  // Cleanup
  useEffect(() => () => { clearInterval(intervalRef.current!) }, [])

  const kcal   = estimateCalories(dur, speed)
  const paceStr = pace(speed)

  return (
    <div className="space-y-3">

      {/* ── Paramètres ───────────────────────────────────────── */}
      {isHIIT ? (
        /* HIIT : durée uniquement */
        <Stepper label="Durée totale (min)" value={dur} unit="min" step={5} min={1} max={120}
          onChange={v => updateParam({ durationMinutes: v })} />
      ) : (
        /* Cardio machine : tous les paramètres */
        <div className="grid grid-cols-2 gap-3">
          <Stepper label="Durée (min)" value={dur}   unit="min"  step={5}   min={1}  max={300}
            onChange={v => updateParam({ durationMinutes: v })} />
          <Stepper label="Distance (km)" value={dist} unit="km"  step={0.5} min={0}  max={100}
            onChange={v => updateParam({ distanceKm: v })} />
          <Stepper label="Vitesse (km/h)" value={speed} unit="km/h" step={0.5} min={0} max={40}
            onChange={v => updateParam({ speedKmH: v })} />
          <Stepper label="Pente (%)" value={incl} unit="%" step={1} min={0} max={20}
            onChange={v => updateParam({ inclinePct: v })} />
        </div>
      )}

      {/* ── Résumé paramètres ─────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {dur > 0 && (
          <span className="flex items-center gap-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 text-xs text-sky-300">
            <Timer className="size-3" /> {dur} min
          </span>
        )}
        {!isHIIT && dist > 0 && (
          <span className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs text-emerald-300">
            <Ruler className="size-3" /> {dist} km
          </span>
        )}
        {!isHIIT && speed > 0 && (
          <span className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs text-amber-300">
            <Wind className="size-3" /> {speed} km/h
            {paceStr && <span className="text-amber-500 ml-1">· {paceStr}</span>}
          </span>
        )}
        {!isHIIT && incl > 0 && (
          <span className="flex items-center gap-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 text-xs text-violet-300">
            <MoveUp className="size-3" /> {incl}%
          </span>
        )}
        <span className="flex items-center gap-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 text-xs text-orange-300">
          <Flame className="size-3" /> ~{kcal} kcal
        </span>
      </div>

      {/* ── Chronomètre / Minuteur ────────────────────────────── */}
      <div className={`rounded-2xl border p-5 space-y-4 ${
        done ? 'bg-[#C8F135]/5 border-[#C8F135]/30' : 'bg-zinc-900 border-zinc-800'
      }`}>

        {/* Mode toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
            <Activity className="size-4 text-sky-400" />
            Minuteur
          </div>
          <div className="inline-flex rounded-xl border border-zinc-700 bg-zinc-800 p-0.5">
            {(['minuteur', 'chrono'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => { resetTimer(); setMode(m) }}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                  mode === m ? 'bg-[#C8F135] text-zinc-900' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {m === 'minuteur' ? 'Décompte' : 'Chrono'}
              </button>
            ))}
          </div>
        </div>

        {/* Affichage temps */}
        <div className="text-center">
          <span className={`text-5xl font-bold tabular-nums font-mono tracking-tight ${
            done ? 'text-[#C8F135]' : mode === 'minuteur' && remaining <= 30 && remaining > 0 ? 'text-red-400' : 'text-white'
          }`}>
            {formatTime(displaySec)}
          </span>
          {mode === 'minuteur' && dur > 0 && (
            <p className="text-xs text-zinc-500 mt-1">
              {done ? 'Terminé !' : `/ ${formatTime(targetSec)}`}
            </p>
          )}
          {mode === 'chrono' && elapsed > 0 && (
            <p className="text-xs text-zinc-500 mt-1">écoulé</p>
          )}
        </div>

        {/* Barre de progression (minuteur seulement) */}
        {mode === 'minuteur' && (
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                remaining <= 30 ? 'bg-red-400' : 'bg-[#C8F135]'
              }`}
              style={{ width: `${pct * 100}%` }}
            />
          </div>
        )}

        {/* Contrôles */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={resetTimer}
            className="size-11 rounded-xl border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
            title="Réinitialiser"
          >
            <RotateCcw className="size-4" />
          </button>

          <button
            type="button"
            onClick={running ? pauseTimer : startTimer}
            disabled={done}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 ${
              running
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                : 'bg-[#C8F135] text-zinc-900 hover:bg-[#d4f54d]'
            }`}
          >
            {running ? <><Pause className="size-4" /> Pause</> : <><Play className="size-4" /> {elapsed > 0 ? 'Reprendre' : 'Démarrer'}</>}
          </button>
        </div>

        {done && (
          <div className="rounded-xl bg-[#C8F135]/10 border border-[#C8F135]/30 px-4 py-2.5 text-center">
            <p className="text-sm font-semibold text-[#C8F135]">Cardio terminé !</p>
          </div>
        )}
      </div>

      {/* ── Bouton Terminer ───────────────────────────────────── */}
      <button
        type="button"
        onClick={onComplete}
        className={`w-full py-4 rounded-2xl text-sm font-bold transition-all active:scale-95 ${
          isCompleted
            ? 'bg-[#C8F135]/15 text-[#C8F135] border border-[#C8F135]/30'
            : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white'
        }`}
      >
        {isCompleted ? '✓ Cardio enregistré' : 'Marquer comme terminé'}
      </button>
    </div>
  )
}
