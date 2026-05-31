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
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={className ?? 'inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors'}
    >
      <ChevronLeft className="size-4" />
      {label}
    </button>
  )
}
