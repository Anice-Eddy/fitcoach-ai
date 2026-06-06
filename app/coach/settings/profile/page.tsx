'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { UserCircle, Save, Camera, LogOut, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { DeleteAccountModal } from '@/components/ui/DeleteAccountModal'
import { signOutAndClear } from '@/lib/auth/client-session'

// Compact switch used for coach-controlled member visibility settings.
function VisibilityToggle({ checked, onChange, label, description }: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-3 text-left transition-colors hover:border-zinc-700"
    >
      <span>
        <span className="block text-xs font-medium text-zinc-200">{label}</span>
        <span className="mt-0.5 block text-[11px] text-zinc-500">{description}</span>
      </span>
      <span className={`flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition-colors ${checked ? 'bg-[#C8F135]' : 'bg-zinc-700'}`}>
        <span className={`size-4 rounded-full bg-black transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </span>
    </button>
  )
}

/** Coach profile settings page: edit bio, specialties, certifications, and upload a verification document. */
export default function CoachSettingsProfilePage() {
  const { data: session, update: updateSession } = useSession()
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [showDel, setShowDel]   = useState(false)
  const [deleting, setDeleting] = useState(false)

  // User fields
  const [name, setName]         = useState('')
  const [accountImage, setAccountImage] = useState('')
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
  const [showMemberCount, setShowMemberCount] = useState(true)
  const [showYearsExperience, setShowYearsExperience] = useState(true)
  const [publicRating, setPublicRating] = useState('')
  const [publicRatingCount, setPublicRatingCount] = useState(0)
  const [showPublicRating, setShowPublicRating] = useState(false)
  const [discoveryCallEnabled, setDiscoveryCallEnabled] = useState(true)
  const [discoveryCallTitle, setDiscoveryCallTitle] = useState('Entretien découverte')
  const [discoveryCallDuration, setDiscoveryCallDuration] = useState(30)
  const [showDiscoveryCall, setShowDiscoveryCall] = useState(true)

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
        setShowMemberCount(p.showMemberCount ?? true)
        setShowYearsExperience(p.showYearsExperience ?? true)
        setPublicRating(p.publicRating?.toString() ?? '')
        setPublicRatingCount(p.publicRatingCount ?? 0)
        setShowPublicRating(p.showPublicRating ?? false)
        setDiscoveryCallEnabled(p.discoveryCallEnabled ?? true)
        setDiscoveryCallTitle(p.discoveryCallTitle ?? 'Entretien découverte')
        setDiscoveryCallDuration(p.discoveryCallDuration ?? 30)
        setShowDiscoveryCall(p.showDiscoveryCall ?? true)
        setAvatarUrl(p.avatarUrl ?? '')
      }
      setLoading(false)
    })
    if (session?.user?.name)  setName(session.user.name)
    setAccountImage(session?.user?.image ?? '')
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

  // Keeps optional numeric settings valid before sending them to the API.
  const parseOptionalNumber = (value: string) => {
    const normalized = value.trim().replace(',', '.')
    if (!normalized) return null
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }

  const readErrorMessage = async (res: Response, fallback: string) => {
    const data = await res.json().catch(() => null)
    if (data?.error && typeof data.error === 'string') return data.error
    const fieldErrors = data?.error?.fieldErrors
    if (fieldErrors && typeof fieldErrors === 'object') {
      const first = Object.values(fieldErrors).flat().find((message) => typeof message === 'string')
      if (typeof first === 'string') return first
    }
    return fallback
  }

  const save = async () => {
    setSaving(true)
    try {
      const safeDiscoveryDuration = Math.min(180, Math.max(5, Number(discoveryCallDuration) || 30))

      // 1. Update User.name and User.image (avatarUrl)
      const accountRes = await fetch('/api/user/account', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // Keep the Google account photo intact; coach avatar is stored separately below.
        body:    JSON.stringify({ name: name.trim(), image: accountImage || null }),
      })
      if (!accountRes.ok) {
        throw new Error(await readErrorMessage(accountRes, 'Impossible de mettre à jour le compte'))
      }

      // 2. Update CoachProfile fields
      const profileRes = await fetch('/api/coach/settings', {
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
          showMemberCount,
          showYearsExperience,
          publicRating:    parseOptionalNumber(publicRating),
          publicRatingCount,
          showPublicRating,
          discoveryCallEnabled,
          discoveryCallTitle: discoveryCallTitle.trim() || 'Entretien découverte',
          discoveryCallDuration: safeDiscoveryDuration,
          showDiscoveryCall,
        }),
      })
      if (!profileRes.ok) {
        throw new Error(await readErrorMessage(profileRes, 'Impossible de mettre à jour les réglages coach'))
      }

      const updatedProfile = await profileRes.json()
      setShowMemberCount(updatedProfile.showMemberCount ?? true)
      setShowYearsExperience(updatedProfile.showYearsExperience ?? true)
      setPublicRating(updatedProfile.publicRating?.toString() ?? '')
      setPublicRatingCount(updatedProfile.publicRatingCount ?? 0)
      setShowPublicRating(updatedProfile.showPublicRating ?? false)
      setDiscoveryCallEnabled(updatedProfile.discoveryCallEnabled ?? true)
      setDiscoveryCallTitle(updatedProfile.discoveryCallTitle ?? 'Entretien découverte')
      setDiscoveryCallDuration(updatedProfile.discoveryCallDuration ?? 30)
      setShowDiscoveryCall(updatedProfile.showDiscoveryCall ?? true)

      await updateSession()
      toast.success('Profil mis à jour')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde')
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
              {avatarUrl || accountImage ? (
                <Image src={avatarUrl || accountImage} alt={name} width={72} height={72}
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
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">URL de l'avatar coach</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                placeholder={accountImage ? 'Laissez vide pour garder la photo Google' : 'https://exemple.com/photo.jpg'}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]"
              />
              {accountImage && !avatarUrl && (
                <p className="mt-1 text-[10px] text-zinc-500">La photo Google reste utilisée tant qu'aucun avatar coach n'est saisi.</p>
              )}
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
            <div className="min-w-0">
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
                className="w-full min-w-0 px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]"
              />
            </div>
            <div className="min-w-0">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Années d'expérience</label>
              <input
                type="number" min={0} max={60}
                value={yearsExp}
                onChange={e => setYearsExp(e.target.value)}
                className="w-full min-w-0 px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#C8F135]"
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

        {/* Visibilité membre */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-sm font-semibold text-white mb-2">Visibilité pour les membres</h2>
          <p className="mb-5 text-xs text-zinc-500">
            Vous pouvez choisir quelles informations seront visibles quand un membre consulte votre profil coach.
          </p>
          <div className="space-y-3">
            <VisibilityToggle
              checked={showMemberCount}
              onChange={setShowMemberCount}
              label="Afficher le nombre de membres"
              description="Le nombre est calculé automatiquement depuis vos membres liés."
            />
            <VisibilityToggle
              checked={showYearsExperience}
              onChange={setShowYearsExperience}
              label="Afficher les années d'expérience"
              description="Masque ou affiche la valeur saisie dans Informations pratiques."
            />
            <VisibilityToggle
              checked={showPublicRating}
              onChange={setShowPublicRating}
              label="Afficher les étoiles"
              description="Affiche la note publique ci-dessous sur votre profil."
            />
          </div>
        </div>

        {/* Note publique */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-sm font-semibold text-white mb-5">Note affichée</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Étoiles</label>
              <input
                type="number" min={0} max={5} step={0.1}
                value={publicRating}
                onChange={e => setPublicRating(e.target.value)}
                placeholder="4.8"
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nombre d'avis affiché</label>
              <input
                type="number" min={0} max={100000}
                value={publicRatingCount}
                onChange={e => setPublicRatingCount(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#C8F135]"
              />
            </div>
          </div>
        </div>

        {/* Entretien découverte */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-sm font-semibold text-white mb-2">Entretien découverte</h2>
          <p className="mb-5 text-xs text-zinc-500">
            Cette option indique aux membres qu'ils peuvent réserver un premier échange avec vous.
          </p>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <VisibilityToggle
              checked={discoveryCallEnabled}
              onChange={setDiscoveryCallEnabled}
              label="Activer l'entretien"
              description="Permet aux membres de voir ce type de rendez-vous."
            />
            <VisibilityToggle
              checked={showDiscoveryCall}
              onChange={setShowDiscoveryCall}
              label="Afficher sur le profil"
              description="Masque ou affiche le bloc d'information côté membre."
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_140px]">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nom affiché</label>
              <input
                type="text"
                value={discoveryCallTitle}
                onChange={e => setDiscoveryCallTitle(e.target.value)}
                placeholder="Entretien découverte"
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Durée</label>
              <input
                type="number" min={5} max={180}
                value={discoveryCallDuration}
                onChange={e => setDiscoveryCallDuration(parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#C8F135]"
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
