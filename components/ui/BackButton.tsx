'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

interface Props {
  label?: string
  fallbackHref?: string
  className?: string
}

export function BackButton({ label = 'Retour', fallbackHref = '/', className }: Props) {
  const router = useRouter()

  const handleBack = () => {
    // Nouvel onglet (target="_blank") → pas d'historique, history.length === 1
    if (window.history.length <= 1) {
      router.push(fallbackHref)
    } else {
      router.back()
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={className ?? 'inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors'}
    >
      <ChevronLeft className="size-4" />
      {label}
    </button>
  )
}
