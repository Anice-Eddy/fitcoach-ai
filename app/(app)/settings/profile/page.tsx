'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { useUserStore } from '@/stores/userStore'
import { toast } from 'sonner'
import { AlertTriangle, BriefcaseBusiness, Save } from 'lucide-react'

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
  const { data: session, update } = useSession()
  const { profile, updateProfile, timezone, setTimezone } = useUserStore()
  const [firstName, setFirstName] = useState(profile?.firstName ?? session?.user?.name ?? '')
  const [email, setEmail] = useState(session?.user?.email ?? '')
  const [image, setImage] = useState(session?.user?.image ?? '')
  const [password, setPassword] = useState('')
  const [language, setLanguage] = useState<'fr' | 'en'>((profile?.language as 'fr' | 'en') ?? 'fr')
  const [tz, setTz] = useState(timezone)
  const [saving, setSaving] = useState(false)
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

  const coachIssues = coachProfile?.verificationIssues ?? []
  const missingCoachFields = coachProfile ? [
    !coachProfile.documentFileName ? 'Document officiel non envoyé.' : '',
    !coachProfile.firstName ? 'Prénom coach manquant.' : '',
    !coachProfile.lastName ? 'Nom de famille coach manquant.' : '',
    !coachProfile.birthDate ? 'Date de naissance coach manquante.' : '',
    !coachProfile.bio ? 'Description professionnelle manquante.' : '',
    coachProfile.specialties.length === 0 ? 'Spécialité manquante.' : '',
    coachProfile.certifications.length === 0 ? 'Certification manquante.' : '',
  ].filter(Boolean) : []
  const showCoachVerificationBanner = Boolean(
    coachProfile
      && coachProfile.verificationStatus !== 'VERIFIED'
      && (coachIssues.length > 0 || missingCoachFields.length > 0 || coachProfile.verificationStatus !== 'PENDING_VERIFICATION'),
  )

  const save = async () => {
    setSaving(true)
    try {
      const accountRes = await fetch('/api/user/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: firstName, email, image, ...(password ? { password } : {}) }),
      })
      if (!accountRes.ok) throw new Error('account')

      const profileRes = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, language }),
      })
      if (!profileRes.ok) throw new Error('profile')
      updateProfile({ firstName, language })
      setTimezone(tz)
      setPassword('')
      await update()
      toast.success('Profil mis à jour')
    } catch {
      toast.error('Impossible de sauvegarder le profil')
    } finally {
      setSaving(false)
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
      toast.success('Espace coach créé')
      router.push('/auth/coach/complete')
    } catch {
      toast.error("Impossible de créer l'espace coach")
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
      <Header title="Mon profil" />
      <PageWrapper>
        <div className="max-w-2xl space-y-6">
          {showCoachVerificationBanner && (
            <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-200" />
                <div>
                  <p className="text-sm font-semibold text-amber-100">
                    Votre profil coach est en cours de vérification.
                  </p>
                  <p className="mt-1 text-sm leading-6 text-amber-100/90">
                    Certaines informations ou documents doivent être validés avant certification complète.
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
              <h1 className="text-[22px] font-medium text-white">Mon profil</h1>
              <button
                type="button"
                onClick={save}
                disabled={saving || !firstName || !email}
                aria-label="Enregistrer mon profil"
                className="flex items-center gap-2 rounded-xl bg-[#C8F135] px-4 py-2.5 text-sm font-bold text-zinc-900 transition-colors hover:bg-[#d4f54d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="size-4" />
                {saving ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-1.5">
                <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">Prénom</span>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#C8F135]" />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">Email</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#C8F135]" />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">Photo de profil</span>
                <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#C8F135]" />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">Nouveau mot de passe</span>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 8 caractères" className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#C8F135]" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">Langue</span>
                  <select value={language} onChange={(e) => setLanguage(e.target.value as 'fr' | 'en')} className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#C8F135]">
                    <option value="fr">FR</option>
                    <option value="en">EN</option>
                  </select>
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">Fuseau horaire</span>
                  <input value={tz} onChange={(e) => setTz(e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#C8F135]" />
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Espace coach</h2>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  Utilise le même compte pour gérer ton profil professionnel, tes disponibilités et tes membres.
                </p>
              </div>
              {coachProfile ? (
                <button
                  type="button"
                  onClick={openCoachSpace}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:border-[#C8F135] hover:text-[#C8F135]"
                >
                  <BriefcaseBusiness className="size-4" />
                  Ouvrir mon espace coach
                </button>
              ) : (
                <button
                  type="button"
                  onClick={createCoachSpace}
                  disabled={creatingCoach}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#C8F135] px-4 py-3 text-sm font-bold text-zinc-950 transition-colors hover:bg-[#d4f54d] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <BriefcaseBusiness className="size-4" />
                  {creatingCoach ? 'Création...' : 'Créer mon espace coach'}
                </button>
              )}
            </div>
          </section>
        </div>
      </PageWrapper>
    </>
  )
}
