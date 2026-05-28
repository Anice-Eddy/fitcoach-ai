'use client'

import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { useUserStore } from '@/stores/userStore'
import { ArrowRight, Sparkles, UserRound } from 'lucide-react'
import { useMyCoach } from '@/lib/coach/use-my-coach'

/** Accompaniment plan settings page: shows current coaching or solo mode, assigned coach info, and upgrade options. */
export default function PlanSettingsPage() {
  const { profile } = useUserStore()
  const { hasCoach, coachName, nextAppointment, loading: coachLoading } = useMyCoach()

  return (
    <>
      <Header title="Mon accompagnement" />
      <PageWrapper>
        <div className="max-w-2xl space-y-6">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#C8F135]/10">
                  {hasCoach ? <UserRound className="size-5 text-[#C8F135]" /> : <Sparkles className="size-5 text-[#C8F135]" />}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.5px] text-zinc-500">Mode actuel</p>
                  <h1 className="mt-1 text-[22px] font-medium text-white">{hasCoach ? 'Coach réel' : 'Coaching IA'}</h1>
                </div>
              </div>
              <Link href="/choose?returnTo=/settings/plan" className="rounded-xl bg-[#C8F135] px-4 py-2.5 text-sm font-bold text-zinc-900 transition-colors hover:bg-[#d4f54d]">
                Changer de mode
              </Link>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {hasCoach ? (
                <>
                  <div className="rounded-xl bg-zinc-800 p-4">
                    <p className="text-xs text-zinc-500">Coach</p>
                    <p className="mt-1 text-sm font-medium text-white">{coachLoading ? 'Synchronisation...' : coachName ?? 'À confirmer'}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-800 p-4">
                    <p className="text-xs text-zinc-500">Prochaine séance</p>
                    <p className="mt-1 text-sm font-medium text-white">
                      {nextAppointment ? new Date(nextAppointment.scheduledAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'À planifier'}
                    </p>
                  </div>
                </>
              ) : (
                <div className="rounded-xl bg-zinc-800 p-4 sm:col-span-2">
                  <p className="text-xs text-zinc-500">Programme en cours</p>
                  <p className="mt-1 text-sm font-medium text-white">{profile?.fitnessGoal ?? 'Programme IA personnalisé'}</p>
                </div>
              )}
            </div>

            <Link
              href={hasCoach ? '/choose?returnTo=/settings/plan' : '/coaches?returnTo=/settings/plan'}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              {hasCoach ? 'Changer de coach' : 'Passer à un coach réel'} <ArrowRight className="size-4" />
            </Link>
          </section>
        </div>
      </PageWrapper>
    </>
  )
}
