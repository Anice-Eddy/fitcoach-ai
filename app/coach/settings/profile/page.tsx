'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { UserCircle, Save, Camera, LogOut, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { DeleteAccountModal } from '@/components/ui/DeleteAccountModal'
import { signOutAndClear } from '@/lib/auth/client-session'

/** Coach profile settings page: edit bio, specialties, certifications, and upload a verification document. */
export default function CoachSettingsProfilePage() {
  const { data: session, update: updateSession } = useSession()
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [showDel, setShowDel]   = useState(false)
  const [deleting, setDeleting] = useState(false)

  // User fields
  const [name, setName]         = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  // Coach profile fields
  const [bio, setBio]                   = useState('')
  const [specialties, setSpecialties]   = useState('')
  const [certifications, setCertifications] = useState('')
  const [yearsExp, setYearsExp]         = useState('')
  const [city, setCity]                 = useState('')
  const [country, setCountry]           = useState('')
  const [phone, setPhone]               = useState('')
  const [memberLimit, setMemberLimit]   = useState(10)

  useEffect(() => {
    Promise.all([
      fetch('/api/coach/profile').then(r => r.ok ? r.json() : null),
    ]).then(([p]) => {
      if (p) {
        setBio(p.bio ?? '')
        setSpecialties((p.specialties ?? []).join(', '))
        setCertifications((p.certifications ?? []).join(', '))
        setYearsExp(p.yearsExperience?.toString() ?? '')
        setCity(p.city ?? '')
        setCountry(p.country ?? '')
        setPhone(p.phone ?? '')
        setMemberLimit(p.memberLimit ?? 10)
        setAvatarUrl(p.avatarUrl ?? '')
      }
      setLoading(false)
    })
    if (session?.user?.name)  setName(session.user.name)
    if (session?.user?.image) setAvatarUrl(prev => prev || session.user!.image!)
  }, [session])

  const handleDeleteAccount = async (password?: string) => {
    setDeleting(true)
    try {
      const res = await fetch('/api/user/account', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Erreur lors de la suppression')
      }
      await signOutAndClear('/')
    } catch (e) {
      setDeleting(false)
      throw e
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      // 1. Update User.name and User.image (avatarUrl)
      await fetch('/api/user/account', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: name.trim(), image: avatarUrl.trim() || null }),
      })

      // 2. Update CoachProfile fields
      await fetch('/api/coach/settings', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          bio:             bio.trim(),
          specialties:     specialties.split(',').map(s => s.trim()).filter(Boolean),
          certifications:  certifications.split(',').map(s => s.trim()).filter(Boolean),
          yearsExperience: yearsExp ? parseInt(yearsExp) : null,
          city:            city.trim()    || null,
          country:         country.trim() || null,
          phone:           phone.trim()   || null,
          memberLimit,
          avatarUrl:       avatarUrl.trim() || null,
        }),
      })

      await updateSession()
      toast.success('Profil mis à jour')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-zinc-800 rounded" />
          <div className="h-64 bg-zinc-800 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {showDel && (
        <DeleteAccountModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDel(false)}
          deleting={deleting}
        />
      )}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <UserCircle className="size-6 text-[#C8F135]" />
          Mon profil coach
        </h1>
        <p className="text-sm text-zinc-400 mt-1">Informations visibles par vos membres</p>
      </div>

      <div className="space-y-6">

        {/* Photo + nom */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-sm font-semibold text-white mb-5">Identité</h2>

          <div className="flex items-center gap-5 mb-5">
            <div className="relative">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={name} width={72} height={72}
                  className="rounded-full ring-2 ring-zinc-700 object-cover" />
              ) : (
                <div className="flex size-[72px] items-center justify-center rounded-full bg-zinc-700 ring-2 ring-zinc-600 text-2xl font-bold text-white">
                  {name[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700">
                <Camera className="size-3 text-zinc-400" />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">URL de la photo de profil</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                placeholder="https://exemple.com/photo.jpg"
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nom affiché</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Prénom Nom"
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]"
            />
          </div>
        </div>

        {/* Bio + spécialités */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-sm font-semibold text-white mb-5">Présentation</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Bio / description</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={5}
                placeholder="Décrivez votre approche, votre méthode, votre philosophie…"
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135] resize-none"
              />
              <p className="text-[10px] text-zinc-600 mt-1">{bio.length} caractères (min. 30)</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Spécialités <span className="text-zinc-600">(séparées par des virgules)</span></label>
              <input
                type="text"
                value={specialties}
                onChange={e => setSpecialties(e.target.value)}
                placeholder="Musculation, Perte de poids, Nutrition sportive"
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Certifications <span className="text-zinc-600">(séparées par des virgules)</span></label>
              <input
                type="text"
                value={certifications}
                onChange={e => setCertifications(e.target.value)}
                placeholder="BPJEPS, CQP, Coach NSCA"
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]"
              />
            </div>
          </div>
        </div>

        {/* Infos pratiques */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-sm font-semibold text-white mb-5">Informations pratiques</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Années d'expérience</label>
              <input
                type="number" min={0} max={60}
                value={yearsExp}
                onChange={e => setYearsExp(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#C8F135]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Limite de membres</label>
              <input
                type="number" min={1} max={500}
                value={memberLimit}
                onChange={e => setMemberLimit(parseInt(e.target.value) || 10)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#C8F135]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Ville</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Paris"
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Pays</label>
              <input
                list="country-list"
                type="text"
                value={country}
                onChange={e => setCountry(e.target.value)}
                placeholder="France"
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]"
              />
              <datalist id="country-list">
                {[
                  'France','Canada','Belgique','Suisse','Luxembourg','Maroc','Algérie',
                  'Tunisie','Sénégal','Côte d\'Ivoire','Madagascar','Cameroun',
                  'États-Unis','Royaume-Uni','Espagne','Italie','Allemagne','Portugal',
                  'Pays-Bas','Australie','Nouvelle-Zélande','Autre',
                ].map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Téléphone</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+33 6 00 00 00 00"
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-semibold text-sm hover:bg-[#d4f54d] transition-colors disabled:opacity-50"
          >
            <Save className="size-4" />
            {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </button>
        </div>

        {/* Account actions */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-300">Compte et sécurité</h2>
          </div>
          <button
            onClick={() => signOutAndClear('/')}
            className="flex items-center gap-3 w-full px-5 py-3.5 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors text-left"
          >
            <LogOut className="size-4 text-zinc-400" />
            <span className="text-sm text-zinc-300">Se déconnecter</span>
          </button>
          <button
            onClick={() => setShowDel(true)}
            className="flex items-center gap-3 w-full px-5 py-3.5 hover:bg-red-500/5 transition-colors text-left"
          >
            <Trash2 className="size-4 text-red-400" />
            <span className="text-sm text-red-400">Supprimer mon compte</span>
          </button>
        </div>

      </div>
    </div>
  )
}
