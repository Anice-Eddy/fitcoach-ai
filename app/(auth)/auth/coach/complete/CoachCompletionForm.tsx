'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AlertTriangle, FileUp, Save } from 'lucide-react'
import { toast } from 'sonner'

type Issue = { field: string; message: string }

type CoachProfileFormProps = {
  initialProfile: {
    firstName: string
    lastName: string
    birthDate: string
    specialty: string
    experience: string
    showYearsExperience: boolean
    showMemberCount: boolean
    publicRating: string
    publicRatingCount: string
    showPublicRating: boolean
    discoveryCallEnabled: boolean
    discoveryCallTitle: string
    discoveryCallDuration: string
    showDiscoveryCall: boolean
    certifications: string
    description: string
    documentFileName: string
    verificationIssues: Issue[]
  }
}

// Toggle used to make visibility choices explicit while the coach completes their profile.
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
      className="flex items-center justify-between gap-3 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-left transition-colors hover:border-zinc-600"
    >
      <span>
        <span className="block text-sm font-medium text-white">{label}</span>
        <span className="mt-0.5 block text-xs text-zinc-500">{description}</span>
      </span>
      <span className={`flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition-colors ${checked ? 'bg-[#C8F135]' : 'bg-zinc-700'}`}>
        <span className={`size-4 rounded-full bg-black transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </span>
    </button>
  )
}

/** Form for completing a coach's professional profile (bio, specialties, certifications, document); submits via multipart PATCH to /api/coach/profile. */
export function CoachCompletionForm({ initialProfile }: CoachProfileFormProps) {
  const router = useRouter()
  const { update: updateSession } = useSession()
  const [form, setForm] = useState(initialProfile)
  const [document, setDocument] = useState<File | null>(null)
  const [issues, setIssues] = useState<Issue[]>(initialProfile.verificationIssues)
  const [saving, setSaving] = useState(false)

  const updateField = <K extends keyof typeof form>(field: K, value: typeof form[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)

    const payload = new FormData()
    payload.set('firstName', form.firstName)
    payload.set('lastName', form.lastName)
    payload.set('birthDate', form.birthDate)
    payload.set('specialty', form.specialty)
    payload.set('experience', form.experience)
    payload.set('showYearsExperience', String(form.showYearsExperience))
    payload.set('showMemberCount', String(form.showMemberCount))
    payload.set('publicRating', form.publicRating)
    payload.set('publicRatingCount', form.publicRatingCount)
    payload.set('showPublicRating', String(form.showPublicRating))
    payload.set('discoveryCallEnabled', String(form.discoveryCallEnabled))
    payload.set('discoveryCallTitle', form.discoveryCallTitle)
    payload.set('discoveryCallDuration', form.discoveryCallDuration)
    payload.set('showDiscoveryCall', String(form.showDiscoveryCall))
    payload.set('certifications', form.certifications)
    payload.set('description', form.description)
    if (document) payload.set('document', document)

    const res = await fetch('/api/coach/profile', { method: 'PATCH', body: payload })
    const data = await res.json()

    setSaving(false)

    if (!res.ok) {
      toast.error('Impossible de sauvegarder le profil coach')
      return
    }

    setIssues(Array.isArray(data.verificationIssues) ? data.verificationIssues : [])
    toast.success('Profil coach envoyé en vérification')
    await updateSession()
    router.refresh()
    router.replace('/coach/dashboard')
  }

  return (
    <form onSubmit={save} className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div>
          <h1 className="text-2xl font-semibold text-white">Compléter le profil coach</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Ces informations servent à vérifier votre identité professionnelle. Vous pourrez utiliser l’application pendant la validation.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">Prénom</span>
            <input required value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-[#C8F135]" />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">Nom de famille</span>
            <input required value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-[#C8F135]" />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">Date de naissance</span>
            <input required type="date" value={form.birthDate} onChange={(e) => updateField('birthDate', e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-[#C8F135]" />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">Spécialité</span>
            <input required value={form.specialty} onChange={(e) => updateField('specialty', e.target.value)} placeholder="Musculation, nutrition, mobilité..." className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-[#C8F135]" />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">Expérience</span>
            <input required min={0} max={60} type="number" value={form.experience} onChange={(e) => updateField('experience', e.target.value)} placeholder="5" className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-[#C8F135]" />
          </label>
          <div className="sm:col-span-2">
            <VisibilityToggle
              checked={form.showYearsExperience}
              onChange={(checked) => updateField('showYearsExperience', checked)}
              label="Rendre mon expérience visible"
              description="Les membres verront ou non vos années d'expérience sur votre profil."
            />
          </div>
          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">Certifications</span>
            <input required value={form.certifications} onChange={(e) => updateField('certifications', e.target.value)} placeholder="BPJEPS, NASM, nutrition sportive" className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-[#C8F135]" />
          </label>
          <label className="grid gap-1.5 sm:col-span-2">
            <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">Description professionnelle</span>
            <textarea required minLength={30} rows={5} value={form.description} onChange={(e) => updateField('description', e.target.value)} className="resize-none rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-[#C8F135]" />
          </label>
          <label className="grid gap-2 sm:col-span-2">
            <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">Diplôme, certification ou document officiel</span>
            <span className="flex min-h-[96px] cursor-pointer items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-800 px-4 py-5 text-center text-sm text-zinc-300 transition-colors hover:border-[#C8F135]">
              <input required={!form.documentFileName} type="file" accept="image/*,.pdf,.txt,.json" className="sr-only" onChange={(e) => setDocument(e.target.files?.[0] ?? null)} />
              <span className="flex flex-col items-center gap-2">
                <FileUp className="size-5 text-[#C8F135]" />
                {document?.name ?? form.documentFileName ?? 'Ajouter un document'}
              </span>
            </span>
          </label>
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="text-sm font-semibold text-white">Visibilité membre</h2>
          <p className="mt-2 text-xs leading-5 text-zinc-400">
            Choisissez maintenant quelles informations seront visibles par les membres. Vous pourrez les modifier plus tard dans votre profil coach.
          </p>
          <div className="mt-4 space-y-3">
            <VisibilityToggle
              checked={form.showMemberCount}
              onChange={(checked) => updateField('showMemberCount', checked)}
              label="Nombre de membres"
              description="Calculé automatiquement depuis vos clients liés."
            />
            <VisibilityToggle
              checked={form.showPublicRating}
              onChange={(checked) => updateField('showPublicRating', checked)}
              label="Étoiles publiques"
              description="Affiche la note saisie ci-dessous sur votre profil."
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="grid min-w-0 gap-1.5">
              <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">Note</span>
              <input min={0} max={5} step={0.1} type="number" value={form.publicRating} onChange={(e) => updateField('publicRating', e.target.value)} placeholder="4.8" className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white outline-none focus:border-[#C8F135]" />
            </label>
            <label className="grid min-w-0 gap-1.5">
              <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">Avis</span>
              <input min={0} type="number" value={form.publicRatingCount} onChange={(e) => updateField('publicRatingCount', e.target.value)} className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white outline-none focus:border-[#C8F135]" />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="text-sm font-semibold text-white">Entretien découverte</h2>
          <div className="mt-4 space-y-3">
            <VisibilityToggle
              checked={form.discoveryCallEnabled}
              onChange={(checked) => updateField('discoveryCallEnabled', checked)}
              label="Activer l'entretien"
              description="Permet aux membres de réserver un premier échange."
            />
            <VisibilityToggle
              checked={form.showDiscoveryCall}
              onChange={(checked) => updateField('showDiscoveryCall', checked)}
              label="Afficher sur mon profil"
              description="Affiche ou masque le bloc entretien côté membre."
            />
          </div>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1.5">
              <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">Nom affiché</span>
              <input value={form.discoveryCallTitle} onChange={(e) => updateField('discoveryCallTitle', e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white outline-none focus:border-[#C8F135]" />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">Durée en minutes</span>
              <input min={5} max={180} type="number" value={form.discoveryCallDuration} onChange={(e) => updateField('discoveryCallDuration', e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white outline-none focus:border-[#C8F135]" />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="text-sm font-semibold text-white">Analyse automatique</h2>
          <p className="mt-2 text-xs leading-5 text-zinc-400">
            Le document est comparé au prénom, au nom et à la date de naissance saisis. Les incohérences n’empêchent pas l’accès à l’application.
          </p>
          {issues.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                <AlertTriangle className="size-4" />
                Corrections à vérifier
              </div>
              <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-100">
                {issues.map((issue) => <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>)}
              </ul>
            </div>
          )}
        </section>

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C8F135] px-4 py-3 text-sm font-bold text-zinc-900 transition-colors hover:bg-[#d4f54d] disabled:opacity-50"
        >
          <Save className="size-4" />
          {saving ? 'Envoi...' : 'Envoyer en vérification'}
        </button>
      </aside>
    </form>
  )
}
