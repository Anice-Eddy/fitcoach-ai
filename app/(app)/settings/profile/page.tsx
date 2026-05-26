'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { useUserStore } from '@/stores/userStore'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

export default function ProfileSettingsPage() {
  const { data: session, update } = useSession()
  const { profile, updateProfile, timezone, setTimezone } = useUserStore()
  const [firstName, setFirstName] = useState(profile?.firstName ?? session?.user?.name ?? '')
  const [email, setEmail] = useState(session?.user?.email ?? '')
  const [image, setImage] = useState(session?.user?.image ?? '')
  const [password, setPassword] = useState('')
  const [language, setLanguage] = useState<'fr' | 'en'>((profile?.language as 'fr' | 'en') ?? 'fr')
  const [tz, setTz] = useState(timezone)
  const [saving, setSaving] = useState(false)

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

  return (
    <>
      <Header title="Mon profil" />
      <PageWrapper>
        <div className="max-w-2xl space-y-6">
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
        </div>
      </PageWrapper>
    </>
  )
}
