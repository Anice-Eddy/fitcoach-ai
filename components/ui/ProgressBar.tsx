'use client'
// Barre de progression réutilisable avec animation et label optionnel

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value:      number  // 0-100
  max?:       number
  label?:     string
  sublabel?:  string
  color?:     string
  size?:      'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_MAP = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' }

/** Animated progress bar with optional label, sub-label, custom color, and three size variants; clamps value between 0 and max. */
export function ProgressBar({
  value, max = 100, label, sublabel, color = '#C8F135', size = 'md', className,
}: ProgressBarProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={cn('w-full', className)}>
      {(label || sublabel) && (
        <div className="flex justify-between items-center mb-1.5">
          {label   && <span className="text-xs font-medium text-zinc-300">{label}</span>}
          {sublabel && <span className="text-xs text-zinc-500">{sublabel}</span>}
        </div>
      )}
      <div className={cn('w-full bg-zinc-800 rounded-full overflow-hidden', SIZE_MAP[size])}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  )
}
