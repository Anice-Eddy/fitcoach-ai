'use client'

import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { useUserStore } from '@/stores/userStore'
import { ArrowRight, Sparkles, UserRound } from 'lucide-react'
import { useMyCoach } from '@/lib/coach/use-my-coach'
import { useLocale } from '@/contexts/LocaleContext'
import { GOAL_LABEL_KEYS } from '@/lib/i18n/profile-label-keys'

function profileGoalLabel(t: (key: string) => string, value?: string | null) {
  if (!value) return null
  const key = GOAL_LABEL_KEYS[value]
  return key ? t(key) : value
}

/** Accompaniment plan settings page: shows current coaching or solo mode, assigned coach info, and upgrade options. */
export default function PlanSettingsPage() {
  const { profile } = useUserStore()
  const { hasCoach, coachName, nextAppointment, loading: coachLoading } = useMyCoach()
  const { locale, t } = useLocale()

  return (
    <>
      <Header title={t('settings.plan')} />
      <PageWrapper>
        <div className="max-w-2xl space-y-6">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#C8F135]/10">
                  {hasCoach ? <UserRound className="size-5 text-[#C8F135]" /> : <Sparkles className="size-5 text-[#C8F135]" />}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.5px] text-zinc-500">{t('settings.currentMode')}</p>
                  <h1 className="mt-1 text-[22px] font-medium text-white">{hasCoach ? t('settings.realCoach') : t('settings.aiCoaching')}</h1>
                </div>
              </div>
              <Link href="/choose?returnTo=/settings/plan" className="rounded-xl bg-[#C8F135] px-4 py-2.5 text-sm font-bold text-zinc-900 transition-colors hover:bg-[#d4f54d]">
                {t('settings.changeMode')}
              </Link>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {hasCoach ? (
                <>
                  <div className="rounded-xl bg-zinc-800 p-4">
                    <p className="text-xs text-zinc-500">{t('settings.coach')}</p>
                    <p className="mt-1 text-sm font-medium text-white">{coachLoading ? t('settings.syncing') : coachName ?? t('settings.toConfirm')}</p>
                  </div>
                  <div className="rounded-xl bg-zinc-800 p-4">
                    <p className="text-xs text-zinc-500">{t('settings.nextSession')}</p>
                    <p className="mt-1 text-sm font-medium text-white">
                      {nextAppointment ? new Date(nextAppointment.scheduledAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : t('settings.toPlan')}
                    </p>
                  </div>
                </>
              ) : (
                <div className="rounded-xl bg-zinc-800 p-4 sm:col-span-2">
                  <p className="text-xs text-zinc-500">{t('settings.currentProgram')}</p>
                  <p className="mt-1 text-sm font-medium text-white">{profileGoalLabel(t, profile?.fitnessGoal) ?? t('settings.customAiProgram')}</p>
                </div>
              )}
            </div>

            <Link
              href={hasCoach ? '/choose?returnTo=/settings/plan' : '/coaches?returnTo=/settings/plan'}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              {hasCoach ? t('settings.changeCoach') : t('settings.switchToRealCoach')} <ArrowRight className="size-4" />
            </Link>
          </section>
        </div>
      </PageWrapper>
    </>
  )
}
