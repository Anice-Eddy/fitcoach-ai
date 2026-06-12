'use client'
// Global error boundary Next.js — reset disponible

import { useEffect } from 'react'
import { TriangleAlert } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
      <div className="max-w-sm text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-red-500/10">
            <TriangleAlert className="size-7 text-red-400" />
          </div>
        </div>
        <h2 className="mb-2 text-xl font-bold">Une erreur est survenue</h2>
        <p className="mb-6 text-sm text-zinc-400">{error.message ?? 'Erreur inattendue.'}</p>
        <button
          onClick={reset}
          className="rounded-xl bg-[#C8F135] px-6 py-2.5 font-bold text-zinc-900 transition-colors hover:bg-[#d4f54d]"
        >
          Réessayer
        </button>
      </div>
    </main>
  )
}
