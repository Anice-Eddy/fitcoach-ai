'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTrainingStore } from '@/stores/trainingStore'
import { X, Plus, Minus } from 'lucide-react'

export function RestTimer() {
  const { activeSession, tickRestTimer, stopRestTimer, startRestTimer } = useTrainingStore()
  const isActive = activeSession?.restTimerActive ?? false
  const seconds  = activeSession?.restSecondsLeft ?? 0
  const [totalSecs, setTotalSecs] = useState(seconds)

  // Track the initial total each time a new timer starts
  useEffect(() => {
    if (isActive && seconds > 0 && seconds > totalSecs - 5) {
      setTotalSecs(seconds)
    }
  }, [isActive])

  useEffect(() => {
    if (!isActive) return
    const interval = setInterval(tickRestTimer, 1000)
    return () => clearInterval(interval)
  }, [isActive, tickRestTimer])

  const pct     = totalSecs > 0 ? (seconds / totalSecs) * 100 : 0
  const minutes = Math.floor(seconds / 60)
  const secs    = seconds % 60

  const addTime = (delta: number) => {
    const newSecs = Math.max(5, seconds + delta)
    startRestTimer(newSecs)
    setTotalSecs(prev => Math.max(5, prev + delta))
  }

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-76 rounded-2xl bg-zinc-950 border border-zinc-700 shadow-2xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white">Temps de repos</p>
            <button onClick={stopRestTimer} className="text-zinc-400 hover:text-white transition-colors">
              <X className="size-4" />
            </button>
          </div>

          <div className="text-center mb-3">
            <span className="text-4xl font-bold text-[#C8F135] tabular-nums">
              {minutes}:{String(secs).padStart(2, '0')}
            </span>
            <p className="text-xs text-zinc-500 mt-1">
              {totalSecs}s au total
            </p>
          </div>

          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-3">
            <motion.div
              className="h-full bg-[#C8F135] rounded-full"
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </div>

          {/* Adjust timer */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <button
              type="button"
              onClick={() => addTime(-15)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-700 text-xs text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
            >
              <Minus className="size-3" /> 15s
            </button>
            <span className="text-xs text-zinc-500">Ajuster</span>
            <button
              type="button"
              onClick={() => addTime(15)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-700 text-xs text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
            >
              <Plus className="size-3" /> 15s
            </button>
          </div>

          <button
            onClick={stopRestTimer}
            className="w-full py-2 rounded-xl bg-zinc-800 text-white text-sm font-medium hover:bg-zinc-700 transition-colors"
          >
            Passer le repos
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
