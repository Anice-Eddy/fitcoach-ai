// Page 404

import Link from 'next/link'
import { Dumbbell } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 text-center">
      <div>
        <div className="flex justify-center mb-6">
          <div className="size-16 rounded-2xl bg-[#C8F135]/10 flex items-center justify-center">
            <Dumbbell className="size-8 text-[#C8F135]" />
          </div>
        </div>
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-zinc-400 mb-8">Cette page n&apos;existe pas ou a été déplacée.</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-bold hover:bg-[#d4f54d] transition-colors"
        >
          Retour au dashboard
        </Link>
      </div>
    </div>
  )
}
