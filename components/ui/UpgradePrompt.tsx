'use client'
// Bannière contextuelle d'upgrade — affichée sur les features réservées Pro+

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Sparkles, X } from 'lucide-react'
import { useState } from 'react'

interface UpgradePromptProps {
  feature:     string
  description?: string
  compact?:    boolean
}

export function UpgradePrompt({ feature, description, compact }: UpgradePromptProps) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  if (compact) {
    return (
      <Link
        href="/pricing"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C8F135]/10 border border-[#C8F135]/20 text-[#C8F135] text-xs font-medium hover:bg-[#C8F135]/20 transition-colors"
      >
        <Sparkles className="size-3" />
        Passer à Pro
      </Link>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl border border-[#C8F135]/20 bg-[#C8F135]/5 p-5"
    >
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-zinc-500 hover:text-white"
        aria-label="Fermer"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="size-9 rounded-xl bg-[#C8F135]/15 flex items-center justify-center shrink-0">
          <Sparkles className="size-4 text-[#C8F135]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white mb-0.5">
            {feature} — fonctionnalité Pro
          </p>
          <p className="text-xs text-zinc-400">
            {description ?? 'Passez à Pro pour débloquer cette fonctionnalité et bien plus encore.'}
          </p>
          <Link
            href="/pricing"
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C8F135] text-zinc-900 text-xs font-bold hover:bg-[#d4f54d] transition-colors"
          >
            <Sparkles className="size-3" />
            Voir les plans — dès 9,99$/mois
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
