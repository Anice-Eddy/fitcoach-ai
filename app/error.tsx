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
    <html lang="fr">
      <body className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 text-white">
        <div className="text-center max-w-sm">
          <div className="flex justify-center mb-6">
            <div className="size-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <TriangleAlert className="size-7 text-red-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2">Une erreur est survenue</h2>
          <p className="text-sm text-zinc-400 mb-6">{error.message ?? 'Erreur inattendue.'}</p>
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-xl bg-[#C8F135] text-zinc-900 font-bold hover:bg-[#d4f54d] transition-colors"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  )
}
