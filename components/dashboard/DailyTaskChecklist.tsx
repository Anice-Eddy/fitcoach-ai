'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle } from 'lucide-react'
import { useLocale } from '@/contexts/LocaleContext'

export interface DailyTask {
  id: string
  label: string
}

interface Props {
  tasks: DailyTask[]
  storageKey?: string
}

/** Renders an animated checklist of daily tasks with localStorage persistence for completed state. */
export function DailyTaskChecklist({ tasks, storageKey = 'BodyOps:daily-tasks' }: Props) {
  const { t } = useLocale()
  const [completed, setCompleted] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setCompleted(JSON.parse(localStorage.getItem(storageKey) ?? '[]') as string[])
    setHydrated(true)
  }, [storageKey])

  if (!hydrated) return null

  const toggle = (id: string) => {
    setCompleted((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
      localStorage.setItem(storageKey, JSON.stringify(next))
      return next
    })
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-500">
        {t('dailyTasks.empty')}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const done = completed.includes(task.id)
        return (
          <motion.button
            key={task.id}
            type="button"
            layout
            animate={{ backgroundColor: done ? 'rgba(200, 241, 53, 0.10)' : 'rgb(24, 24, 27)' }}
            onClick={() => toggle(task.id)}
            aria-label={done ? `${t('dailyTasks.markAsTodo')} ${task.label}` : `${t('dailyTasks.markAsDone')} ${task.label}`}
            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:border-zinc-600 disabled:opacity-50 ${
              done ? 'border-[#C8F135]/40 text-[#C8F135]' : 'border-zinc-800 text-zinc-300'
            }`}
          >
            {done ? <CheckCircle2 className="size-5 shrink-0" /> : <Circle className="size-5 shrink-0 text-zinc-600" />}
            <span className="text-sm font-medium">{task.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
