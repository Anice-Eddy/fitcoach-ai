'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, ChevronDown, Youtube, RefreshCw, CheckCircle2 } from 'lucide-react'
import type { SessionExercise } from '@/types'
import { useTrainingStore } from '@/stores/trainingStore'
import { EXERCISE_DATABASE } from '@/lib/training/exercise-database'

function extractYtId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m?.[1] ?? null
}

interface Props {
  exercise:        SessionExercise
  exerciseIndex:   number
  totalExercises:  number
  completedSets:   number
  weight:          number
  reps:            number
  onWeightChange:  (w: number) => void
  onRepsChange:    (r: number) => void
  onSetComplete:   () => void
  onPrev:          () => void
  onNext:          () => void
  hasPrev:         boolean
  hasNext:         boolean
}

export function FocusExerciseView({
  exercise, exerciseIndex, totalExercises, completedSets,
  weight, reps, onWeightChange, onRepsChange, onSetComplete,
  onPrev, onNext, hasPrev, hasNext,
}: Props) {
  const [showInstructions, setShowInstructions] = useState(false)
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [ytImgError, setYtImgError]             = useState(false)
  const { replaceExercise }                     = useTrainingStore()
  const isAllDone = completedSets >= exercise.sets

  const videoId = useMemo(
    () => exercise.videoUrl ? extractYtId(exercise.videoUrl) : null,
    [exercise.videoUrl],
  )

  const alternatives = EXERCISE_DATABASE.filter(
    item => item.id !== exercise.id && item.muscleGroups.some(g => exercise.muscleGroups.includes(g)),
  ).slice(0, 5)

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

      {/* Exercise header */}
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
        </p>
        <div className="flex items-center gap-2">
          {isAllDone && <CheckCircle2 className="size-5 text-[#C8F135] shrink-0" />}
          <h2 className={`text-xl font-bold ${isAllDone ? 'text-[#C8F135]' : 'text-white'}`}>
            {exercise.name}
          </h2>
        </div>
        <p className="text-xs text-zinc-500 mt-1">{exercise.muscleGroups.join(' · ')}</p>
      </motion.div>

      {/* Weight + Reps */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Charge (kg)', value: weight, step: 2.5, min: 0, onChange: onWeightChange },
          { label: 'Répétitions', value: reps,   step: 1,   min: 1, onChange: onRepsChange },
        ].map(({ label, value, step, min, onChange }) => (
          <div key={label} className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
            <label className="block text-xs text-zinc-400 mb-2">{label}</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChange(Math.max(min, +(value - step).toFixed(1)))}
                className="size-9 rounded-lg bg-zinc-800 text-white text-lg font-bold hover:bg-zinc-700 shrink-0"
              >−</button>
              <span className="flex-1 text-center text-xl font-bold text-white">{value}</span>
              <button
                type="button"
                onClick={() => onChange(+(value + step).toFixed(1))}
                className="size-9 rounded-lg bg-zinc-800 text-white text-lg font-bold hover:bg-zinc-700 shrink-0"
              >+</button>
            </div>
          </div>
        ))}
      </div>

      {/* Set tracker */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
        <p className="text-xs text-zinc-400 mb-3">
          Séries &nbsp;·&nbsp;
          <span className={isAllDone ? 'text-[#C8F135] font-semibold' : 'text-white font-semibold'}>
            {completedSets}
          </span>
          <span className="text-zinc-500"> / {exercise.sets}</span>
        </p>
        <div className="flex gap-2">
          {Array.from({ length: exercise.sets }, (_, i) => {
            const isDone    = i < completedSets
            const isCurrent = i === completedSets
            return (
              <button
                key={i}
                type="button"
                disabled={!isCurrent}
                onClick={isCurrent ? onSetComplete : undefined}
                aria-label={isDone ? `Série ${i + 1} terminée` : isCurrent ? `Démarrer série ${i + 1}` : `Série ${i + 1}`}
                className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all ${
                  isDone
                    ? 'bg-[#C8F135]/15 text-[#C8F135] border border-[#C8F135]/30 cursor-default'
                    : isCurrent
                    ? 'bg-[#C8F135] text-zinc-900 shadow-lg active:scale-95'
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
              >
                {isDone ? '✓' : i + 1}
              </button>
            )
          })}
        </div>
      </div>

      {/* YouTube tutorial */}
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

      {/* Instructions (collapsible) */}
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

      {/* Replace exercise */}
      <button
        type="button"
        onClick={() => setShowAlternatives(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
      >
        <RefreshCw className="size-4" /> Remplacer cet exercice
      </button>

      {/* Prev / Next */}
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
          {!hasNext ? (isAllDone ? 'Terminer 🎉' : 'Terminer') : (isAllDone ? 'Suivant ✓' : 'Suivant')}
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Alternatives modal */}
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
                <button
                  type="button"
                  onClick={() => setShowAlternatives(false)}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Fermer
                </button>
              </div>
              <div className="space-y-2">
                {alternatives.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => chooseAlternative(item)}
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
