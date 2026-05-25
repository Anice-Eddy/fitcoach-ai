'use client'
// Page paramètres — profil, unités, plan, déconnexion

import { PageWrapper }         from '@/components/layout/PageWrapper'
import { useUserStore }        from '@/stores/userStore'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { signOut, useSession } from 'next-auth/react'
import { toast }               from 'sonner'
import Link                    from 'next/link'
import { User, CreditCard, LogOut, ChevronRight, Trash2 } from 'lucide-react'

export default function SettingsPage() {
  const { profile }          = useUserStore()
  const { plan, isPro }      = useSubscriptionStore()
  const { data: session }    = useSession()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const handleDeleteAccount = () => {
    toast.error('Fonctionnalité en cours de développement.')
  }

  const PLAN_LABEL: Record<string, string> = {
    FREE: 'Gratuit',
    PRO:  'Pro',
    ELITE:'Elite',
    BUSINESS: 'Business',
  }

  return (
    <PageWrapper>
      <div className="space-y-6 max-w-lg">
        <h1 className="text-2xl font-bold text-white">Paramètres</h1>

        {/* Profil */}
        <section className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-300">Compte</h2>
          </div>
          <div className="p-5 flex items-center gap-4">
            <div className="size-12 rounded-full bg-zinc-800 flex items-center justify-center">
              {session?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="" className="size-12 rounded-full object-cover" />
              ) : (
                <User className="size-6 text-zinc-400" />
              )}
            </div>
            <div>
              <div className="font-medium text-white">{session?.user?.name ?? profile?.firstName ?? 'Utilisateur'}</div>
              <div className="text-sm text-zinc-400">{session?.user?.email ?? '—'}</div>
            </div>
          </div>

          <Link
            href="/onboarding"
            className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-800 hover:bg-zinc-800/50 transition-colors"
          >
            <span className="text-sm text-zinc-300">Modifier mon profil</span>
            <ChevronRight className="size-4 text-zinc-500" />
          </Link>
        </section>

        {/* Abonnement */}
        <section className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-300">Abonnement</h2>
          </div>
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="size-5 text-zinc-400" />
              <div>
                <div className="text-sm font-medium text-white">Plan {PLAN_LABEL[plan] ?? plan}</div>
                <div className="text-xs text-zinc-500">{isPro() ? 'Accès complet' : 'Fonctionnalités limitées'}</div>
              </div>
            </div>
            <Link
              href="/pricing"
              className="text-xs px-3 py-1.5 rounded-lg bg-[#C8F135]/10 text-[#C8F135] hover:bg-[#C8F135]/20 font-medium transition-colors"
            >
              {isPro() ? 'Gérer' : 'Passer Pro'}
            </Link>
          </div>

          {isPro() && (
            <form action="/api/stripe/portal" method="POST">
              <button
                type="submit"
                className="flex items-center justify-between w-full px-5 py-3.5 border-t border-zinc-800 hover:bg-zinc-800/50 transition-colors text-left"
              >
                <span className="text-sm text-zinc-300">Gérer la facturation</span>
                <ChevronRight className="size-4 text-zinc-500" />
              </button>
            </form>
          )}
        </section>

        {/* Préférences */}
        <section className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-300">Préférences</h2>
          </div>
          {[
            { label: 'Unités de mesure', value: profile?.weightUnit === 'LB' ? 'Livres (lb)' : 'Kilogrammes (kg)' },
            { label: 'Objectif principal', value: profile?.fitnessGoal ?? '—' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 last:border-0">
              <span className="text-sm text-zinc-300">{item.label}</span>
              <span className="text-sm text-zinc-500">{item.value}</span>
            </div>
          ))}
        </section>

        {/* Danger zone */}
        <section className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-300">Danger</h2>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-5 py-3.5 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors text-left"
          >
            <LogOut className="size-4 text-zinc-400" />
            <span className="text-sm text-zinc-300">Se déconnecter</span>
          </button>
          <button
            onClick={handleDeleteAccount}
            className="flex items-center gap-3 w-full px-5 py-3.5 hover:bg-red-500/5 transition-colors text-left"
          >
            <Trash2 className="size-4 text-red-400" />
            <span className="text-sm text-red-400">Supprimer mon compte</span>
          </button>
        </section>

        <p className="text-xs text-center text-zinc-600">FitCoachAI v1.0 · Made with ❤️</p>
      </div>
    </PageWrapper>
  )
}
