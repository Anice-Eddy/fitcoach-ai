'use client'
// Item d'exercice dans une séance active — sets, reps, charge, complétion

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, CheckCircle2, Circle } from 'lucide-react'
import type { SessionExercise } from '@/types'
import { useTrainingStore } from '@/stores/trainingStore'

interface Props { exercise: SessionExercise; index: number }

export function ExerciseItem({ exercise, index }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [weight, setWeight]     = useState(exercise.weightKg ?? 0)
  const [reps, setReps]         = useState(exercise.reps)
  const { completeExercise, startRestTimer } = useTrainingStore()

  const handleComplete = () => {
    completeExercise(index, { weightKg: weight, reps, isCompleted: true })
    startRestTimer(exercise.restSeconds ?? 90)
  }

  return (
    <div className={`rounded-xl border transition-colors ${exercise.isCompleted ? 'border-[#C8F135]/30 bg-[#C8F135]/5' : 'border-zinc-800 bg-zinc-900'}`}>
      {/* En-tête */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        {exercise.isCompleted
          ? <CheckCircle2 className="size-5 text-[#C8F135] shrink-0" />
          : <Circle className="size-5 text-zinc-600 shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${exercise.isCompleted ? 'text-[#C8F135]' : 'text-white'}`}>{exercise.name}</p>
          <p className="text-xs text-zinc-500">{exercise.sets} séries × {reps} reps · {weight > 0 ? `${weight} kg` : 'au poids du corps'}</p>
        </div>
        <ChevronDown className={`size-4 text-zinc-500 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Détails expandés */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-zinc-800 pt-3">
              {/* Ajustement charge et reps */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Charge (kg)</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setWeight(Math.max(0, weight - 2.5))} className="size-8 rounded-lg bg-zinc-800 text-white font-bold hover:bg-zinc-700">−</button>
                    <span className="flex-1 text-center text-sm font-bold text-white">{weight}</span>
                    <button onClick={() => setWeight(weight + 2.5)} className="size-8 rounded-lg bg-zinc-800 text-white font-bold hover:bg-zinc-700">+</button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Répétitions</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setReps(Math.max(1, reps - 1))} className="size-8 rounded-lg bg-zinc-800 text-white font-bold hover:bg-zinc-700">−</button>
                    <span className="flex-1 text-center text-sm font-bold text-white">{reps}</span>
                    <button onClick={() => setReps(reps + 1)} className="size-8 rounded-lg bg-zinc-800 text-white font-bold hover:bg-zinc-700">+</button>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              {exercise.instructions.length > 0 && (
                <div className="rounded-lg bg-zinc-800 p-3">
                  <p className="text-xs font-medium text-zinc-300 mb-2">Instructions</p>
                  <ol className="space-y-1">
                    {exercise.instructions.map((inst, i) => (
                      <li key={i} className="text-xs text-zinc-400 flex gap-2">
                        <span className="text-[#C8F135] font-bold shrink-0">{i+1}.</span>
                        {inst}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <button
                onClick={handleComplete}
                disabled={exercise.isCompleted}
                className="w-full py-2 rounded-xl bg-[#C8F135] text-zinc-900 text-sm font-bold disabled:opacity-50 hover:bg-[#d4f54d] transition-colors"
              >
                {exercise.isCompleted ? '✓ Terminé' : 'Marquer terminé'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
