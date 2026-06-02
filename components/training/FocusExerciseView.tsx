'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, ChevronDown, Youtube, RefreshCw, CheckCircle2 } from 'lucide-react'
import type { SessionExercise } from '@/types'
import { useTrainingStore } from '@/stores/trainingStore'
import { EXERCISE_DATABASE } from '@/lib/training/exercise-database'
import { CardioTimerView } from './CardioTimerView'

function extractYtId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m?.[1] ?? null
}

// ── Stepper avec champ numérique éditable à la main ─────────────────────────
function Stepper({
  label, value, unit, step = 1, min = 0, max, onChange,
}: {
  label: string; value: number; unit?: string; step?: number; min?: number; max?: number
  onChange: (v: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState('')

  const commit = () => {
    const parsed = parseFloat(draft.replace(',', '.'))
    if (!isNaN(parsed)) {
      let clamped = parsed
      if (min !== undefined) clamped = Math.max(min, clamped)
      if (max !== undefined) clamped = Math.min(max, clamped)
      onChange(+clamped.toFixed(2))
    }
    setEditing(false)
  }

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
      <label className="block text-xs text-zinc-400 mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min ?? 0, +(value - step).toFixed(2)))}
          className="size-10 rounded-xl bg-zinc-800 text-white text-xl font-bold hover:bg-zinc-700 shrink-0 active:scale-95 transition-transform"
        >−</button>

        {editing ? (
          <input
            autoFocus
            type="number"
            inputMode="decimal"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') commit() }}
            className="flex-1 text-center text-2xl font-bold text-white bg-zinc-800 rounded-xl py-1 outline-none focus:ring-2 focus:ring-[#C8F135] tabular-nums"
          />
        ) : (
          <button
            type="button"
            onClick={() => { setDraft(String(value)); setEditing(true) }}
            className="flex-1 text-center text-2xl font-bold text-white py-1 hover:text-[#C8F135] transition-colors tabular-nums"
            title="Appuyer pour modifier"
          >
            {value}{unit && <span className="text-sm text-zinc-500 ml-1">{unit}</span>}
          </button>
        )}

        <button
          type="button"
          onClick={() => onChange(+(value + step).toFixed(2))}
          className="size-10 rounded-xl bg-zinc-800 text-white text-xl font-bold hover:bg-zinc-700 shrink-0 active:scale-95 transition-transform"
        >+</button>
      </div>
      <p className="text-[10px] text-zinc-600 text-center mt-1">Appuie sur la valeur pour saisir</p>
    </div>
  )
}

// Formate les secondes en "1m 30s" ou "45s"
function formatRestLabel(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m > 0 && s > 0) return `${m}m ${s}s`
  if (m > 0) return `${m}m`
  return `${s}s`
}

interface Props {
  exercise:          SessionExercise
  exerciseIndex:     number
  totalExercises:    number
  completedSets:     number
  weight:            number
  reps:              number
  onWeightChange:    (w: number) => void
  onRepsChange:      (r: number) => void
  onSetsChange:      (s: number) => void
  onRestChange:      (r: number) => void
  onCardioChange:    (fields: Partial<Pick<SessionExercise, 'durationMinutes' | 'distanceKm' | 'speedKmH' | 'inclinePct'>>) => void
  onSetComplete:     () => void
  onPrev:            () => void
  onNext:            () => void
  hasPrev:           boolean
  hasNext:           boolean
}

export function FocusExerciseView({
  exercise, exerciseIndex, totalExercises, completedSets,
  weight, reps, onWeightChange, onRepsChange, onSetsChange, onRestChange, onCardioChange,
  onSetComplete, onPrev, onNext, hasPrev, hasNext,
}: Props) {
  const [showInstructions, setShowInstructions] = useState(false)
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [ytImgError,       setYtImgError]       = useState(false)
  const { replaceExercise } = useTrainingStore()

  const isCardio  = exercise.muscleGroups[0] === 'CARDIO'
  const totalSets = exercise.sets
  const isAllDone = isCardio
    ? completedSets >= 1
    : completedSets >= totalSets

  const videoId = useMemo(
    () => exercise.videoUrl ? extractYtId(exercise.videoUrl) : null,
    [exercise.videoUrl],
  )

  const alternatives = useMemo(() => {
    const matches = EXERCISE_DATABASE.filter(
      item => item.id !== exercise.id && item.muscleGroups.some(g => exercise.muscleGroups.includes(g)),
    )
    // Mélange Fisher-Yates pour que tous les exercices aient une chance d'apparaître
    const shuffled = [...matches]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled.slice(0, 10)
  }, [exercise.id, exercise.muscleGroups])

  const chooseAlternative = (item: typeof EXERCISE_DATABASE[number]) => {
    replaceExercise(exerciseIndex, {
      ...item,
      order:       exercise.order,
      sets:        exercise.sets,
      reps:        exercise.reps,
      weightKg:    exercise.weightKg,
      restSeconds: exercise.restSeconds,
      tempo:       exercise.tempo,
      isCompleted: false,
    })
    setShowAlternatives(false)
  }

  return (
    <div className="space-y-4">

      {/* ── En-tête exercice ─────────────────────────────────── */}
      <motion.div
        key={exercise.id}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className={`rounded-2xl border p-5 transition-colors ${
          isAllDone ? 'bg-[#C8F135]/5 border-[#C8F135]/30' : 'bg-zinc-900 border-zinc-800'
        }`}
      >
        <p className="text-xs text-zinc-500 mb-1">
          Exercice {exerciseIndex + 1} / {totalExercises}
          {isCardio && (
            <span className="ml-2 px-1.5 py-0.5 rounded-md bg-sky-500/15 text-sky-400 text-[10px] font-semibold">CARDIO</span>
          )}
        </p>
        <div className="flex items-center gap-2">
          {isAllDone && <CheckCircle2 className="size-5 text-[#C8F135] shrink-0" />}
          <h2 className={`text-xl font-bold ${isAllDone ? 'text-[#C8F135]' : 'text-white'}`}>
            {exercise.name}
          </h2>
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          {exercise.muscleGroups.filter(g => g !== 'CARDIO').join(' · ') || exercise.muscleGroups.join(' · ')}
        </p>
      </motion.div>

      {/* ── VUE CARDIO — délégué à CardioTimerView ───────────── */}
      {isCardio ? (
        <CardioTimerView
          exercise={exercise}
          isCompleted={isAllDone}
          onCardioChange={onCardioChange}
          onComplete={onSetComplete}
        />
      ) : (
        /* ── VUE MUSCULATION ─────────────────────────────────── */
        <>
          {/* Charge + Répétitions */}
          <div className="grid grid-cols-2 gap-3">
            <Stepper label="Charge (kg)" value={weight} step={2.5} min={0}   onChange={onWeightChange} />
            <Stepper label="Répétitions" value={reps}   step={1}   min={1}   onChange={onRepsChange} />
          </div>

          {/* Séries + Repos */}
          <div className="grid grid-cols-2 gap-3">
            <Stepper label="Séries" value={totalSets} step={1} min={1} max={10} onChange={onSetsChange} />
            <Stepper
              label={`Repos (${formatRestLabel(exercise.restSeconds)})`}
              value={exercise.restSeconds}
              unit="s"
              step={15}
              min={15}
              onChange={onRestChange}
            />
          </div>

          {/* ── Suivi des séries ─────────────────────────────── */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-3">
            {/* Progression */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-400">
                Progression des séries
              </p>
              <p className="text-xs font-semibold">
                <span className={completedSets >= totalSets ? 'text-[#C8F135]' : 'text-white'}>
                  {completedSets}
                </span>
                <span className="text-zinc-500"> / {totalSets}</span>
              </p>
            </div>

            {/* Pastilles de séries */}
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: totalSets }, (_, i) => {
                const isDone    = i < completedSets
                const isCurrent = i === completedSets
                return (
                  <div
                    key={i}
                    className={`flex-1 min-w-[40px] py-2.5 rounded-xl text-xs font-bold text-center transition-all ${
                      isDone
                        ? 'bg-[#C8F135]/15 text-[#C8F135] border border-[#C8F135]/30'
                        : isCurrent
                        ? 'border border-zinc-600 text-zinc-400 bg-zinc-800'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-700'
                    }`}
                  >
                    {isDone ? '✓' : i + 1}
                  </div>
                )
              })}
            </div>

            {/* Bouton principal — Valider la série */}
            {completedSets < totalSets && (
              <button
                type="button"
                onClick={onSetComplete}
                className="w-full py-4 rounded-2xl bg-[#C8F135] text-zinc-900 text-base font-bold shadow-lg hover:bg-[#d4f54d] active:scale-95 transition-all"
              >
                Valider la série {completedSets + 1} / {totalSets}
              </button>
            )}

            {completedSets >= totalSets && (
              <div className="w-full py-3 rounded-2xl bg-[#C8F135]/10 border border-[#C8F135]/30 text-center">
                <p className="text-sm font-semibold text-[#C8F135]">✓ Toutes les séries terminées</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {weight > 0 ? `${weight} kg × ${reps} rép.` : `${reps} rép.`}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Tutoriel YouTube ─────────────────────────────────── */}
      {exercise.videoUrl && (
        <a
          href={exercise.videoUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Tutoriel YouTube pour ${exercise.name}`}
          className="block relative rounded-2xl overflow-hidden group/yt"
        >
          {videoId && !ytImgError ? (
            <Image
              src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
              alt={exercise.name}
              width={480} height={360}
              className="w-full h-32 object-cover"
              onError={() => setYtImgError(true)}
            />
          ) : (
            <div className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center gap-3">
              <Youtube className="size-7 text-red-500" />
              <span className="text-sm text-zinc-400">Voir la technique</span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/yt:bg-black/35 transition-colors">
            <div className="bg-red-600 rounded-full p-2.5 shadow-xl group-hover/yt:scale-110 transition-transform">
              <svg className="size-5 fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
        </a>
      )}

      {/* ── Instructions ─────────────────────────────────────── */}
      {exercise.instructions.length > 0 && (
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowInstructions(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-zinc-300 hover:text-white"
          >
            Instructions
            <ChevronDown className={`size-4 transition-transform ${showInstructions ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showInstructions && (
              <motion.ol
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden px-4 pb-4 space-y-1.5"
              >
                {exercise.instructions.map((inst, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex gap-2">
                    <span className="text-[#C8F135] font-bold shrink-0">{i + 1}.</span>
                    {inst}
                  </li>
                ))}
              </motion.ol>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Remplacer ─────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setShowAlternatives(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
      >
        <RefreshCw className="size-4" /> Remplacer cet exercice
      </button>

      {/* ── Précédent / Suivant ───────────────────────────────── */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrev}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-zinc-700 text-sm font-medium text-zinc-300 disabled:opacity-30 hover:bg-zinc-900 transition-colors"
        >
          <ChevronLeft className="size-4" /> Précédent
        </button>
        <button
          type="button"
          onClick={onNext}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-bold transition-colors ${
            isAllDone
              ? 'bg-[#C8F135] text-zinc-900 hover:bg-[#d4f54d]'
              : 'border border-zinc-700 text-zinc-300 hover:bg-zinc-900'
          }`}
        >
          {!hasNext ? (isAllDone ? 'Terminer 🎉' : 'Terminer quand même') : (isAllDone ? 'Suivant ✓' : 'Passer')}
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* ── Modal alternatives ────────────────────────────────── */}
      <AnimatePresence>
        {showAlternatives && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 pb-4"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">Exercices alternatifs</h3>
                <button type="button" onClick={() => setShowAlternatives(false)}
                  className="text-sm text-zinc-400 hover:text-white transition-colors">Fermer</button>
              </div>
              <div className="space-y-2">
                {alternatives.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">Aucun exercice similaire.</p>
                ) : alternatives.map(item => (
                  <button key={item.id} type="button" onClick={() => chooseAlternative(item)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-left hover:border-[#C8F135]/50 hover:bg-zinc-800 transition-colors"
                  >
                    <p className="text-sm font-medium text-white">{item.name}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{item.muscleGroups.join(', ')}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
