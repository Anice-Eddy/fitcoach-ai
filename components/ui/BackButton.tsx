'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ChevronLeft } from 'lucide-react'

interface Props {
  label?: string
  className?: string
}

export function BackButton({ label = 'Retour', className }: Props) {
  const router  = useRouter()
  const { status } = useSession()

  const handleBack = () => {
    if (window.history.length <= 1) {
      router.push(status === 'authenticated' ? '/dashboard' : '/')
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
