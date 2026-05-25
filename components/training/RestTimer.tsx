'use client'
// Chronomètre de repos entre les séries — se lance automatiquement après chaque exercice
// deps: npm install framer-motion

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTrainingStore } from '@/stores/trainingStore'
import { X } from 'lucide-react'

export function RestTimer() {
  const { activeSession, tickRestTimer, stopRestTimer } = useTrainingStore()
  const isActive = activeSession?.restTimerActive ?? false
  const seconds  = activeSession?.restSecondsLeft ?? 0

  useEffect(() => {
    if (!isActive) return
    const interval = setInterval(tickRestTimer, 1000)
    return () => clearInterval(interval)
  }, [isActive, tickRestTimer])

  const pct     = activeSession ? (seconds / 90) * 100 : 0
  const minutes = Math.floor(seconds / 60)
  const secs    = seconds % 60

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-72 rounded-2xl bg-zinc-950 border border-zinc-700 shadow-2xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white">Repos</p>
            <button onClick={stopRestTimer} className="text-zinc-400 hover:text-white">
              <X className="size-4" />
            </button>
          </div>

          <div className="text-center mb-3">
            <span className="text-4xl font-bold text-[#C8F135] tabular-nums">
              {minutes}:{String(secs).padStart(2, '0')}
            </span>
          </div>

          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#C8F135] rounded-full"
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </div>

          <button
            onClick={stopRestTimer}
            className="mt-3 w-full py-2 rounded-xl bg-zinc-800 text-white text-sm font-medium hover:bg-zinc-700 transition-colors"
          >
            Passer le repos
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
