'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
    certifications: string
    description: string
    documentFileName: string
    verificationIssues: Issue[]
  }
}

export function CoachCompletionForm({ initialProfile }: CoachProfileFormProps) {
  const router = useRouter()
  const [form, setForm] = useState(initialProfile)
  const [document, setDocument] = useState<File | null>(null)
  const [issues, setIssues] = useState<Issue[]>(initialProfile.verificationIssues)
  const [saving, setSaving] = useState(false)

  const update = (field: keyof typeof form, value: string) => {
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
    router.push('/coach/dashboard')
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
            <input required value={form.firstName} onChange={(e) => update('firstName', e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-[#C8F135]" />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">Nom de famille</span>
            <input required value={form.lastName} onChange={(e) => update('lastName', e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-[#C8F135]" />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">Date de naissance</span>
            <input required type="date" value={form.birthDate} onChange={(e) => update('birthDate', e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-[#C8F135]" />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">Spécialité</span>
            <input required value={form.specialty} onChange={(e) => update('specialty', e.target.value)} placeholder="Musculation, nutrition, mobilité..." className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-[#C8F135]" />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">Expérience</span>
            <input required min={0} max={60} type="number" value={form.experience} onChange={(e) => update('experience', e.target.value)} placeholder="5" className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-[#C8F135]" />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">Certifications</span>
            <input required value={form.certifications} onChange={(e) => update('certifications', e.target.value)} placeholder="BPJEPS, NASM, nutrition sportive" className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-[#C8F135]" />
          </label>
          <label className="grid gap-1.5 sm:col-span-2">
            <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">Description professionnelle</span>
            <textarea required minLength={30} rows={5} value={form.description} onChange={(e) => update('description', e.target.value)} className="resize-none rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-[#C8F135]" />
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
