'use client'
// Workout session card showing status, duration, and exercises.

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Clock, Dumbbell, CheckCircle2, Circle, PlayCircle } from 'lucide-react'
import type { WorkoutSession } from '@/types'
import { useLocale } from '@/contexts/LocaleContext'
import { exerciseDisplayName } from '@/lib/training/exercise-database'

interface Props { session: WorkoutSession; index: number; isToday?: boolean }

const STATUS_CONFIG = {
  PLANNED:     { icon: Circle,       color: 'text-zinc-400', bg: 'bg-zinc-400/10',  labelKey: 'training.status.planned' },
  IN_PROGRESS: { icon: PlayCircle,   color: 'text-amber-400',bg: 'bg-amber-400/10', labelKey: 'training.status.inProgress' },
  COMPLETED:   { icon: CheckCircle2, color: 'text-[#C8F135]',bg: 'bg-[#C8F135]/10', labelKey: 'training.status.completed' },
  SKIPPED:     { icon: Circle,       color: 'text-zinc-600', bg: 'bg-zinc-600/10',  labelKey: 'training.status.skipped' },
}

/** Animated workout session card showing status icon, duration estimate, and exercise list with a link to start or view the session. */
export function WorkoutCard({ session, index, isToday = false }: Props) {
  const { locale, t } = useLocale()
  const config     = STATUS_CONFIG[session.status]
  const StatusIcon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`rounded-2xl bg-zinc-900 border p-5 hover:border-zinc-700 transition-colors ${
        isToday ? 'border-[#C8F135]/40' : 'border-zinc-800'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`size-8 rounded-lg flex items-center justify-center ${config.bg}`}>
            <StatusIcon className={`size-4 ${config.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">{session.name}</h3>
              {isToday && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#C8F135]/15 text-[#C8F135] font-semibold">
                  {t('training.today')}
                </span>
              )}
            </div>
            <span className={`text-xs ${config.color}`}>{t(config.labelKey)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-zinc-400">
          <Clock className="size-3.5" />
          {session.durationMinutes ?? '—'} min
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Dumbbell className="size-3.5 text-zinc-500" />
        <p className="text-xs text-zinc-500">{session.exercises.length} {t('training.exerciseCount')}</p>
        <span className="text-zinc-700">·</span>
        <p className="text-xs text-zinc-500">
          {session.exercises.filter((e) => e.isCompleted).length} / {session.exercises.length} {t('training.finishedCount')}
        </p>
      </div>

      {/* Exercise preview */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {session.exercises.slice(0, 4).map((ex) => (
          <span key={ex.id} className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400">
            {exerciseDisplayName(ex, locale)}
          </span>
        ))}
        {session.exercises.length > 4 && (
          <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-500">
            +{session.exercises.length - 4}
          </span>
        )}
      </div>

      {session.status !== 'COMPLETED' && (
        <Link
          href={`/training/${session.id}`}
          className="block w-full text-center py-2 rounded-xl bg-[#C8F135] text-zinc-900 text-sm font-bold hover:bg-[#d4f54d] transition-colors"
        >
          {session.status === 'IN_PROGRESS' ? t('training.resume') : t('training.start')}
        </Link>
      )}
    </motion.div>
  )
}
