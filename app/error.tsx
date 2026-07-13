'use client'
// Global Next.js error boundary with reset support.

import { useEffect } from 'react'
import { TriangleAlert } from 'lucide-react'
import { useLocale } from '@/contexts/LocaleContext'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useLocale()

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
        <h2 className="mb-2 text-xl font-bold">{t('common.error')}</h2>
        <p className="mb-6 text-sm text-zinc-400">{error.message ?? t('system.unexpectedError')}</p>
        <button
          onClick={reset}
          className="rounded-xl bg-[#C8F135] px-6 py-2.5 font-bold text-zinc-900 transition-colors hover:bg-[#d4f54d]"
        >
          {t('common.retry')}
        </button>
      </div>
    </main>
  )
}
