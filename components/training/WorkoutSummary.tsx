'use client'
// Résumé de fin de séance — stats, progression, actions

import { motion } from 'framer-motion'
import Link from 'next/link'
import { CheckCircle2, Clock, Dumbbell, Flame, Trophy } from 'lucide-react'
import type { ActiveSession } from '@/stores/trainingStore'

interface Props {
  session:   ActiveSession
  onClose:   () => void
}

export function WorkoutSummary({ session, onClose }: Props) {
  const completed   = session.exercises.filter((e) => e.isCompleted).length
  const totalSets   = session.exercises.reduce((acc, e) => acc + e.sets, 0)
  const totalVolume = session.exercises.reduce((acc, e) => acc + (e.weightKg ?? 0) * e.reps * e.sets, 0)
  const duration    = Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm rounded-3xl bg-zinc-900 border border-zinc-700 p-6"
      >
        {/* Trophée */}
        <div className="flex justify-center mb-5">
          <div className="size-16 rounded-2xl bg-[#C8F135]/15 flex items-center justify-center">
            <Trophy className="size-8 text-[#C8F135]" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-white text-center mb-1">Séance terminée !</h2>
        <p className="text-sm text-zinc-400 text-center mb-6">{session.name}</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { icon: Clock,         label: 'Durée',     value: `${duration} min`,    color: '#60a5fa' },
            { icon: CheckCircle2,  label: 'Exercices', value: `${completed}/${session.exercises.length}`, color: '#C8F135' },
            { icon: Dumbbell,      label: 'Séries',    value: totalSets,             color: '#a78bfa' },
            { icon: Flame,         label: 'Volume',    value: `${Math.round(totalVolume)} kg`, color: '#fb923c' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="rounded-xl bg-zinc-800 p-3 flex items-center gap-2">
              <Icon className="size-4 shrink-0" style={{ color }} />
              <div>
                <p className="text-xs text-zinc-500">{label}</p>
                <p className="text-sm font-bold text-white">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-bold hover:bg-[#d4f54d] transition-colors"
          >
            Terminer
          </button>
          <Link
            href="/progress"
            className="block w-full py-3 rounded-xl bg-zinc-800 text-white text-center font-medium hover:bg-zinc-700 transition-colors"
          >
            Voir la progression
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
