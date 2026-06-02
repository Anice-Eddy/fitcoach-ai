'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTrainingStore } from '@/stores/trainingStore'
import { X, Plus, Minus, Bell } from 'lucide-react'

// Génère un bip court via Web Audio API
function playBeep(frequency = 880, duration = 0.18, volume = 0.4) {
  try {
    const ctx  = new AudioContext()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type            = 'sine'
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
    osc.onended = () => ctx.close()
  } catch {}
}

function playEndSound() {
  // Trois bips croissants pour signaler la fin du repos
  playBeep(660, 0.15, 0.35)
  setTimeout(() => playBeep(770, 0.15, 0.35), 200)
  setTimeout(() => playBeep(880, 0.25, 0.5),  400)
}

/** Animated rest-period countdown with audio notification, +/− 15s adjustments, and auto-dismiss. */
export function RestTimer() {
  const { activeSession, tickRestTimer, stopRestTimer, startRestTimer } = useTrainingStore()
  const isActive = activeSession?.restTimerActive ?? false
  const seconds  = activeSession?.restSecondsLeft ?? 0

  const [totalSecs, setTotalSecs] = useState(seconds)
  const [done, setDone]           = useState(false)
  const prevActive                = useRef(false)
  const prevSeconds               = useRef(seconds)

  // Capture le total quand un nouveau timer démarre
  useEffect(() => {
    if (isActive && !prevActive.current) {
      setTotalSecs(seconds)
      setDone(false)
    }
    prevActive.current = isActive
  }, [isActive, seconds])

  // Tick toutes les secondes
  useEffect(() => {
    if (!isActive) return
    const interval = setInterval(tickRestTimer, 1000)
    return () => clearInterval(interval)
  }, [isActive, tickRestTimer])

  // Détecte la fin du décompte et joue le son
  useEffect(() => {
    if (prevSeconds.current > 0 && seconds === 0 && isActive === false) {
      setDone(true)
      playEndSound()
      // Auto-dismiss après 3 secondes
      const t = setTimeout(() => setDone(false), 3000)
      return () => clearTimeout(t)
    }
    prevSeconds.current = seconds
  }, [seconds, isActive])

  const pct     = totalSecs > 0 ? (seconds / totalSecs) * 100 : 0
  const minutes = Math.floor(seconds / 60)
  const secs    = seconds % 60

  const addTime = (delta: number) => {
    const newSecs = Math.max(5, seconds + delta)
    startRestTimer(newSecs)
    if (delta > 0) setTotalSecs(prev => prev + delta)
  }

  const shouldShow = isActive || done

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-80 rounded-2xl border shadow-2xl p-4 ${
            done
              ? 'bg-[#C8F135]/10 border-[#C8F135]/40'
              : 'bg-zinc-950 border-zinc-700'
          }`}
        >
          {done ? (
            /* ── ÉTAT TERMINÉ ─────────────────────────── */
            <div className="text-center py-2">
              <Bell className="size-7 text-[#C8F135] mx-auto mb-2 animate-bounce" />
              <p className="text-lg font-bold text-[#C8F135]">Repos terminé !</p>
              <p className="text-xs text-zinc-400 mt-1">Reprends quand tu es prêt.</p>
            </div>
          ) : (
            /* ── DÉCOMPTE ─────────────────────────────── */
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-white">Temps de repos</p>
                <button onClick={stopRestTimer} className="text-zinc-400 hover:text-white transition-colors">
                  <X className="size-4" />
                </button>
              </div>

              <div className="text-center mb-3">
                <span className={`text-4xl font-bold tabular-nums font-mono ${
                  seconds <= 10 ? 'text-red-400' : 'text-[#C8F135]'
                }`}>
                  {minutes}:{String(secs).padStart(2, '0')}
                </span>
                <p className="text-xs text-zinc-500 mt-1">{totalSecs}s au total</p>
              </div>

              {/* Barre de progression */}
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-3">
                <motion.div
                  className={`h-full rounded-full ${seconds <= 10 ? 'bg-red-400' : 'bg-[#C8F135]'}`}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                />
              </div>

              {/* Ajuster */}
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
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
