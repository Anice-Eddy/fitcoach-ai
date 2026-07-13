'use client'
// Reusable empty state with icon, title, description, and optional action.

import { motion } from 'framer-motion'
import Link from 'next/link'

interface EmptyStateProps {
  icon?:        React.ReactNode
  title:        string
  description?: string
  action?:      { label: string; href?: string; onClick?: () => void }
}

/** Generic empty-state placeholder with optional icon, description text, and a CTA link or button. */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {icon && (
        <div className="size-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4 text-zinc-500">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
      {description && <p className="text-sm text-zinc-400 max-w-xs">{description}</p>}
      {action && (
        <div className="mt-6">
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C8F135] text-zinc-900 text-sm font-semibold hover:bg-[#d4f54d] transition-colors"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C8F135] text-zinc-900 text-sm font-semibold hover:bg-[#d4f54d] transition-colors"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}
