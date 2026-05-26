'use client'

import Link from 'next/link'
import { Dumbbell, Users } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export default function RegisterChoicePage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <div className="mb-6 flex justify-center">
            <Logo href="/" size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-white">Créer un compte</h1>
          <p className="text-sm text-zinc-400 mt-1">Choisissez votre profil pour commencer</p>
        </div>

        <div className="grid gap-4">
          <Link
            href="/auth/register/member"
            className="group flex items-start gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-[#C8F135]/50 hover:bg-zinc-800"
          >
            <div className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#C8F135]/10">
              <Dumbbell className="size-5 text-[#C8F135]" />
            </div>
            <div>
              <p className="font-semibold text-white group-hover:text-[#C8F135] transition-colors">
                Je suis un athlète
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Suivez vos séances d&apos;entraînement, votre nutrition et vos progrès. Accès gratuit.
              </p>
            </div>
          </Link>

          <Link
            href="/auth/register/coach"
            className="group flex items-start gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-[#C8F135]/50 hover:bg-zinc-800"
          >
            <div className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
              <Users className="size-5 text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-white group-hover:text-[#C8F135] transition-colors">
                Je suis un coach
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Gérez vos clients, créez des programmes personnalisés et suivez leurs progrès.
              </p>
            </div>
          </Link>
        </div>

        <p className="text-center text-sm text-zinc-400 mt-8">
          Déjà un compte ?{' '}
          <Link href="/auth/signin" className="text-[#C8F135] hover:underline font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
