'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { UserCircle, Save, Camera, LogOut, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { DeleteAccountModal } from '@/components/ui/DeleteAccountModal'
import { signOutAndClear } from '@/lib/auth/client-session'
import { useLocale } from '@/contexts/LocaleContext'

const COUNTRY_OPTIONS = [
  'France','Canada','Belgique','Suisse','Luxembourg','Maroc','Algérie',
  'Tunisie','Sénégal','Côte d\'Ivoire','Madagascar','Cameroun',
  'États-Unis','Royaume-Uni','Espagne','Italie','Allemagne','Portugal',
  'Pays-Bas','Australie','Nouvelle-Zélande','Autre',
]
const COUNTRY_I18N: Record<string, string> = {
  France: 'france',
  Canada: 'canada',
  Belgique: 'belgium',
  Suisse: 'switzerland',
  Luxembourg: 'luxembourg',
  Maroc: 'morocco',
  Algérie: 'algeria',
  Tunisie: 'tunisia',
  Sénégal: 'senegal',
  'Côte d\'Ivoire': 'ivoryCoast',
  Madagascar: 'madagascar',
  Cameroun: 'cameroon',
  'États-Unis': 'unitedStates',
  'Royaume-Uni': 'unitedKingdom',
  Espagne: 'spain',
  Italie: 'italy',
  Allemagne: 'germany',
  Portugal: 'portugal',
  'Pays-Bas': 'netherlands',
  Australie: 'australia',
  'Nouvelle-Zélande': 'newZealand',
  Autre: 'other',
}

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
  const { t } = useLocale()
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
  const [discoveryCallTitle, setDiscoveryCallTitle] = useState(() => t('coachSettings.discovery.defaultTitle'))
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
        setDiscoveryCallTitle(p.discoveryCallTitle ?? t('coachSettings.discovery.defaultTitle'))
        setDiscoveryCallDuration(p.discoveryCallDuration ?? 30)
        setShowDiscoveryCall(p.showDiscoveryCall ?? true)
        setAvatarUrl(p.avatarUrl ?? '')
      }
      setLoading(false)
    })
    if (session?.user?.name)  setName(session.user.name)
    setAccountImage(session?.user?.image ?? '')
  }, [session, t])

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
        throw new Error(data.error ?? t('coachSettings.deleteError'))
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
        throw new Error(await readErrorMessage(accountRes, t('coachSettings.accountUpdateError')))
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
          discoveryCallTitle: discoveryCallTitle.trim() || t('coachSettings.discovery.defaultTitle'),
          discoveryCallDuration: safeDiscoveryDuration,
          showDiscoveryCall,
        }),
      })
      if (!profileRes.ok) {
        throw new Error(await readErrorMessage(profileRes, t('coachSettings.profileUpdateError')))
      }

      const updatedProfile = await profileRes.json()
      setShowMemberCount(updatedProfile.showMemberCount ?? true)
      setShowYearsExperience(updatedProfile.showYearsExperience ?? true)
      setPublicRating(updatedProfile.publicRating?.toString() ?? '')
      setPublicRatingCount(updatedProfile.publicRatingCount ?? 0)
      setShowPublicRating(updatedProfile.showPublicRating ?? false)
      setDiscoveryCallEnabled(updatedProfile.discoveryCallEnabled ?? true)
      setDiscoveryCallTitle(updatedProfile.discoveryCallTitle ?? t('coachSettings.discovery.defaultTitle'))
      setDiscoveryCallDuration(updatedProfile.discoveryCallDuration ?? 30)
      setShowDiscoveryCall(updatedProfile.showDiscoveryCall ?? true)

      await updateSession()
      toast.success(t('coachSettings.updated'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('coachSettings.saveError'))
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
          {t('coachSettings.title')}
        </h1>
        <p className="text-sm text-zinc-400 mt-1">{t('coachSettings.description')}</p>
      </div>

      <div className="space-y-6">

        {/* Photo + nom */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-sm font-semibold text-white mb-5">{t('coachSettings.identity')}</h2>

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
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('coachSettings.avatarUrl')}</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                placeholder={accountImage ? t('coachSettings.keepGooglePhotoPlaceholder') : 'https://example.com/photo.jpg'}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]"
              />
              {accountImage && !avatarUrl && (
                <p className="mt-1 text-[10px] text-zinc-500">{t('coachSettings.googlePhotoHint')}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('coachSettings.displayName')}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('coachSettings.displayNamePlaceholder')}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]"
            />
          </div>
        </div>

        {/* Bio + specialties */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-sm font-semibold text-white mb-5">{t('coachSettings.presentation')}</h2>
          <div className="space-y-4">
            <div className="min-w-0">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('coachSettings.bio')}</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={5}
                placeholder={t('coachSettings.bioPlaceholder')}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135] resize-none"
              />
              <p className="text-[10px] text-zinc-600 mt-1">{bio.length} {t('coachSettings.charactersMin')}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('coachSettings.specialties')} <span className="text-zinc-600">{t('coachSettings.commaSeparated')}</span></label>
              <input
                type="text"
                value={specialties}
                onChange={e => setSpecialties(e.target.value)}
                placeholder={t('coachSettings.specialtiesPlaceholder')}
                className="w-full min-w-0 px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]"
              />
            </div>
            <div className="min-w-0">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('coachSettings.certifications')} <span className="text-zinc-600">{t('coachSettings.commaSeparated')}</span></label>
              <input
                type="text"
                value={certifications}
                onChange={e => setCertifications(e.target.value)}
                placeholder={t('coachSettings.certificationsPlaceholder')}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]"
              />
            </div>
          </div>
        </div>

        {/* Infos pratiques */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-sm font-semibold text-white mb-5">{t('coachSettings.practicalInfo')}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('coachSettings.yearsExperience')}</label>
              <input
                type="number" min={0} max={60}
                value={yearsExp}
                onChange={e => setYearsExp(e.target.value)}
                className="w-full min-w-0 px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#C8F135]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('coachSettings.memberLimit')}</label>
              <input
                type="number" min={1} max={500}
                value={memberLimit}
                onChange={e => setMemberLimit(parseInt(e.target.value) || 10)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#C8F135]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('coachSettings.city')}</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder={t('coachSettings.cityPlaceholder')}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('coachSettings.country')}</label>
              <input
                list="country-list"
                type="text"
                value={country}
                onChange={e => setCountry(e.target.value)}
                placeholder={t('coachSettings.countryPlaceholder')}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]"
              />
              <datalist id="country-list">
                {COUNTRY_OPTIONS.map(c => (
                  <option key={c} value={c} label={t(`coachSettings.countries.${COUNTRY_I18N[c]}`)} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('coachSettings.phone')}</label>
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

        {/* Member visibility */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-sm font-semibold text-white mb-2">{t('coachSettings.visibility.title')}</h2>
          <p className="mb-5 text-xs text-zinc-500">
            {t('coachSettings.visibility.description')}
          </p>
          <div className="space-y-3">
            <VisibilityToggle
              checked={showMemberCount}
              onChange={setShowMemberCount}
              label={t('coachSettings.visibility.showMemberCount')}
              description={t('coachSettings.visibility.memberCountDescription')}
            />
            <VisibilityToggle
              checked={showYearsExperience}
              onChange={setShowYearsExperience}
              label={t('coachSettings.visibility.showYears')}
              description={t('coachSettings.visibility.yearsDescription')}
            />
            <VisibilityToggle
              checked={showPublicRating}
              onChange={setShowPublicRating}
              label={t('coachSettings.visibility.showStars')}
              description={t('coachSettings.visibility.starsDescription')}
            />
          </div>
        </div>

        {/* Note publique */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-sm font-semibold text-white mb-5">{t('coachSettings.publicRating.title')}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('coachSettings.publicRating.stars')}</label>
              <input
                type="number" min={0} max={5} step={0.1}
                value={publicRating}
                onChange={e => setPublicRating(e.target.value)}
                placeholder="4.8"
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('coachSettings.publicRating.reviewCount')}</label>
              <input
                type="number" min={0} max={100000}
                value={publicRatingCount}
                onChange={e => setPublicRatingCount(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#C8F135]"
              />
            </div>
          </div>
        </div>

        {/* Discovery call */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-sm font-semibold text-white mb-2">{t('coachSettings.discovery.title')}</h2>
          <p className="mb-5 text-xs text-zinc-500">
            {t('coachSettings.discovery.description')}
          </p>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <VisibilityToggle
              checked={discoveryCallEnabled}
              onChange={setDiscoveryCallEnabled}
              label={t('coachSettings.discovery.enable')}
              description={t('coachSettings.discovery.enableDescription')}
            />
            <VisibilityToggle
              checked={showDiscoveryCall}
              onChange={setShowDiscoveryCall}
              label={t('coachSettings.discovery.showOnProfile')}
              description={t('coachSettings.discovery.showDescription')}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_140px]">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('coachSettings.displayName')}</label>
              <input
                type="text"
                value={discoveryCallTitle}
                onChange={e => setDiscoveryCallTitle(e.target.value)}
                placeholder={t('coachSettings.discovery.defaultTitle')}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('coachSettings.discovery.duration')}</label>
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
            {saving ? t('coachMembers.saving') : t('coachSettings.saveChanges')}
          </button>
        </div>

        {/* Account actions */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-300">{t('coachSettings.accountSecurity')}</h2>
          </div>
          <button
            onClick={() => signOutAndClear('/')}
            className="flex items-center gap-3 w-full px-5 py-3.5 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors text-left"
          >
            <LogOut className="size-4 text-zinc-400" />
            <span className="text-sm text-zinc-300">{t('coachSettings.signOut')}</span>
          </button>
          <button
            onClick={() => setShowDel(true)}
            className="flex items-center gap-3 w-full px-5 py-3.5 hover:bg-red-500/5 transition-colors text-left"
          >
            <Trash2 className="size-4 text-red-400" />
            <span className="text-sm text-red-400">{t('settings.deleteAccount')}</span>
          </button>
        </div>

      </div>
    </div>
  )
}
