'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { useUserStore } from '@/stores/userStore'
import { toast } from 'sonner'
import { AlertTriangle, BriefcaseBusiness, MailCheck, Save, Send } from 'lucide-react'
import {
  firebaseRequestEmailChange,
  firebaseSendCurrentUserEmailVerification,
} from '@/lib/firebase/client'
import { useLocale } from '@/contexts/LocaleContext'
import { LanguageToggle } from '@/components/i18n/LanguageToggle'

type CoachVerificationIssue = { field: string; message: string }

type CoachProfileVerification = {
  id: string
  verificationStatus: 'PENDING_VERIFICATION' | 'NEEDS_CORRECTION' | 'VERIFIED' | 'REJECTED'
  verificationIssues: CoachVerificationIssue[] | null
  documentFileName: string | null
  firstName: string | null
  lastName: string | null
  birthDate: string | null
  bio: string | null
  specialties: string[]
  certifications: string[]
}

/** Profile settings page: update display name, avatar, timezone, and account email/password; includes account deletion. */
export default function ProfileSettingsPage() {
  const router = useRouter()
  const { t } = useLocale()
  const { data: session, update } = useSession()
  const { profile, updateProfile, timezone, setTimezone } = useUserStore()
  const [firstName, setFirstName] = useState(profile?.firstName ?? session?.user?.name ?? '')
  const [email, setEmail] = useState(session?.user?.email ?? '')
  const [image, setImage] = useState(session?.user?.image ?? '')
  const [password, setPassword] = useState('')
  const [tz, setTz] = useState(timezone)
  const [saving, setSaving] = useState(false)
  const [sendingVerification, setSendingVerification] = useState(false)
  const [initialEmail, setInitialEmail] = useState(session?.user?.email ?? '')
  const [creatingCoach, setCreatingCoach] = useState(false)
  const [coachProfile, setCoachProfile] = useState<CoachProfileVerification | null>(null)

  useEffect(() => {
    let mounted = true
    fetch('/api/coach/profile')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (mounted) setCoachProfile(data)
      })
      .catch(() => undefined)
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (session?.user?.email) {
      setEmail(session.user.email)
      setInitialEmail(session.user.email)
    }
    if (session?.user?.name) setFirstName(session.user.name)
    if (session?.user?.image) setImage(session.user.image)
  }, [session?.user?.email, session?.user?.image, session?.user?.name])

  const coachIssues = coachProfile?.verificationIssues ?? []
  const missingCoachFields = coachProfile ? [
    !coachProfile.documentFileName ? t('settings.missingOfficialDocument') : '',
    !coachProfile.firstName ? t('settings.missingCoachFirstName') : '',
    !coachProfile.lastName ? t('settings.missingCoachLastName') : '',
    !coachProfile.birthDate ? t('settings.missingCoachBirthDate') : '',
    !coachProfile.bio ? t('settings.missingCoachBio') : '',
    coachProfile.specialties.length === 0 ? t('settings.missingCoachSpecialty') : '',
    coachProfile.certifications.length === 0 ? t('settings.missingCoachCertification') : '',
  ].filter(Boolean) : []
  const showCoachVerificationBanner = Boolean(
    coachProfile
      && coachProfile.verificationStatus !== 'VERIFIED'
      && (coachIssues.length > 0 || missingCoachFields.length > 0 || coachProfile.verificationStatus !== 'PENDING_VERIFICATION'),
  )

  const save = async () => {
    setSaving(true)
    try {
      const normalizedEmail = email.trim().toLowerCase()
      const emailChanged = normalizedEmail && normalizedEmail !== initialEmail.toLowerCase()
      if (emailChanged) {
        await firebaseRequestEmailChange(normalizedEmail, '/settings/profile')
      }

      const accountRes = await fetch('/api/user/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: firstName, image, ...(password ? { password } : {}) }),
      })
      if (!accountRes.ok) throw new Error('account')

      const profileRes = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName }),
      })
      if (!profileRes.ok) throw new Error('profile')
      updateProfile({ firstName })
      setTimezone(tz)
      setPassword('')
      await update()
      toast.success(emailChanged
        ? t('settings.profileUpdatedEmail')
        : t('settings.profileUpdated'))
    } catch {
      toast.error(t('settings.profileSaveError'))
    } finally {
      setSaving(false)
    }
  }

  const sendVerificationEmail = async () => {
    setSendingVerification(true)
    try {
      await firebaseSendCurrentUserEmailVerification('/settings/profile')
      toast.success(t('settings.emailVerificationSent'))
    } catch {
      toast.error(t('settings.emailVerificationError'))
    } finally {
      setSendingVerification(false)
    }
  }

  const createCoachSpace = async () => {
    setCreatingCoach(true)
    try {
      // Create a CoachProfile on the existing account, then refresh the session
      // so middleware allows access to the coach completion flow immediately.
      const res = await fetch('/api/coach/profile', { method: 'POST' })
      if (!res.ok) throw new Error('coach-profile')
      const data = await res.json()
      setCoachProfile(data)
      await update()
      toast.success(t('settings.coachSpaceCreated'))
      router.push('/auth/coach/complete')
    } catch {
      toast.error(t('settings.coachSpaceCreateError'))
    } finally {
      setCreatingCoach(false)
    }
  }

  const openCoachSpace = async () => {
    // Refresh the JWT before entering /coach so newly created coach access is recognized.
    await update()
    router.push('/coach/dashboard')
  }

  return (
    <>
      <Header title={t('settings.myProfile')} />
      <PageWrapper>
        <div className="max-w-2xl space-y-6">
          {showCoachVerificationBanner && (
            <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-200" />
                <div>
                  <p className="text-sm font-semibold text-amber-100">
                    {t('settings.coachVerificationTitle')}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-amber-100/90">
                    {t('settings.coachVerificationDescription')}
                  </p>
                  {(missingCoachFields.length > 0 || coachIssues.length > 0) && (
                    <ul className="mt-3 space-y-1 text-xs leading-5 text-amber-100/90">
                      {[...missingCoachFields, ...coachIssues.map((issue) => issue.message)].map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-[22px] font-medium text-white">{t('settings.myProfile')}</h1>
              <button
                type="button"
                onClick={save}
                disabled={saving || !firstName || !email}
                aria-label={t('settings.saveProfile')}
                className="flex items-center gap-2 rounded-xl bg-[#C8F135] px-4 py-2.5 text-sm font-bold text-zinc-900 transition-colors hover:bg-[#d4f54d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="size-4" />
                {saving ? t('settings.saving') : t('common.save')}
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-1.5">
                <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">{t('settings.firstName')}</span>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#C8F135]" />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">{t('auth.email')}</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#C8F135]" />
              </label>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-3">
                    <MailCheck className="mt-0.5 size-5 shrink-0 text-[#C8F135]" />
                    <div>
                      <p className="text-sm font-semibold text-white">{t('settings.emailVerification')}</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-400">
                        {t('settings.emailVerificationDescription')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={sendVerificationEmail}
                    disabled={sendingVerification}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:border-[#C8F135] hover:text-[#C8F135] disabled:opacity-50"
                  >
                    <Send className="size-3.5" />
                    {sendingVerification ? t('settings.sending') : t('settings.resend')}
                  </button>
                </div>
              </div>
              <label className="grid gap-1.5">
                <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">{t('settings.profilePhoto')}</span>
                <input value={image} onChange={(e) => setImage(e.target.value)} placeholder={t('common.urlPlaceholder')} className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#C8F135]" />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">{t('settings.newPassword')}</span>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('settings.passwordMin')} className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#C8F135]" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">{t('settings.language')}</span>
                  <LanguageToggle />
                </div>
                <label className="grid gap-1.5">
                  <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">{t('settings.timezone')}</span>
                  <input value={tz} onChange={(e) => setTz(e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#C8F135]" />
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">{t('settings.coachSpace')}</h2>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  {t('settings.coachSpaceDescription')}
                </p>
              </div>
              {coachProfile ? (
                <button
                  type="button"
                  onClick={openCoachSpace}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:border-[#C8F135] hover:text-[#C8F135]"
                >
                  <BriefcaseBusiness className="size-4" />
                  {t('settings.openCoachSpace')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={createCoachSpace}
                  disabled={creatingCoach}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#C8F135] px-4 py-3 text-sm font-bold text-zinc-950 transition-colors hover:bg-[#d4f54d] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <BriefcaseBusiness className="size-4" />
                  {creatingCoach ? t('settings.creating') : t('settings.createCoachSpace')}
                </button>
              )}
            </div>
          </section>
        </div>
      </PageWrapper>
    </>
  )
}
