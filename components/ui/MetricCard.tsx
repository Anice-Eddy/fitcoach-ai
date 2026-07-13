'use client'
// Reusable metric card with loading, error, and empty states.

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricCardProps {
  title:      string
  value:      string | number
  unit?:      string
  subtitle?:  string
  trend?:     number       // positive means increase, negative means decrease
  trendLabel?: string
  icon?:      React.ReactNode
  isLoading?: boolean
  className?: string
  accentColor?: string
}

/** Animated stat card with title, value, optional unit, trend arrow, and a loading skeleton state. */
export function MetricCard({
  title, value, unit, subtitle, trend, trendLabel,
  icon, isLoading, className, accentColor = '#C8F135',
}: MetricCardProps) {
  if (isLoading) {
    return (
      <div className={cn('rounded-2xl bg-zinc-900 border border-zinc-800 p-5 animate-pulse', className)}>
        <div className="h-4 w-24 bg-zinc-800 rounded mb-3" />
        <div className="h-8 w-16 bg-zinc-800 rounded" />
      </div>
    )
  }

  const TrendIcon = trend === 0 ? Minus : trend! > 0 ? TrendingUp : TrendingDown
  const trendColor = trend === 0 ? 'text-zinc-400' : trend! > 0 ? 'text-emerald-400' : 'text-red-400'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'rounded-2xl bg-zinc-900 border border-zinc-800 p-5 hover:border-zinc-700 transition-colors',
        className,
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-zinc-400 font-medium">{title}</p>
        {icon && (
          <div className="size-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accentColor}15` }}>
            <span style={{ color: accentColor }}>{icon}</span>
          </div>
        )}
      </div>

      <div className="flex items-end gap-1.5">
        <span className="text-2xl font-bold text-white tabular-nums">{value}</span>
        {unit && <span className="text-sm text-zinc-400 mb-0.5">{unit}</span>}
      </div>

      {(subtitle || trend !== undefined) && (
        <div className="flex items-center gap-2 mt-2">
          {trend !== undefined && (
            <span className={cn('flex items-center gap-0.5 text-xs font-medium', trendColor)}>
              <TrendIcon className="size-3" />
              {Math.abs(trend)}{unit}
            </span>
          )}
          {trendLabel && <span className="text-xs text-zinc-500">{trendLabel}</span>}
          {subtitle && !trendLabel && <span className="text-xs text-zinc-500">{subtitle}</span>}
        </div>
      )}
    </motion.div>
  )
}
