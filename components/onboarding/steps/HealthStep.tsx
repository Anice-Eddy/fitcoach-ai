'use client'
// Étape 5 : Santé & Blessures — zones à ménager pour l'IA

import { useState } from 'react'
import { X, Plus, ShieldAlert } from 'lucide-react'
import type { HealthData, InjuryEntry } from '@/utils/validators'

interface Props {
  defaultValues?: Partial<HealthData>
  onNext: (data: HealthData) => void
  onBack: () => void
}

const BODY_PARTS = [
  'Épaule gauche', 'Épaule droite',
  'Coude gauche', 'Coude droit',
  'Poignet gauche', 'Poignet droit',
  'Dos / Lombaires', 'Nuque / Cervicales',
  'Genou gauche', 'Genou droit',
  'Cheville gauche', 'Cheville droite',
  'Hanche gauche', 'Hanche droite',
  'Pectoraux', 'Abdominaux',
]

const SEVERITY_LABELS: Record<InjuryEntry['severity'], { label: string; color: string }> = {
  MILD:     { label: 'Légère',  color: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10' },
  MODERATE: { label: 'Modérée', color: 'text-orange-400 border-orange-400/40 bg-orange-400/10' },
  SEVERE:   { label: 'Grave',   color: 'text-red-400 border-red-400/40 bg-red-400/10' },
}

/** Onboarding step to declare injuries or pain zones so the AI avoids/adapts exercises. */
export function HealthStep({ defaultValues, onNext, onBack }: Props) {
  const [injuries, setInjuries] = useState<InjuryEntry[]>(defaultValues?.injuries ?? [])
  const [adding, setAdding]     = useState(false)
  const [draft, setDraft]       = useState<Partial<InjuryEntry>>({ severity: 'MILD' })

  const addInjury = () => {
    if (!draft.bodyPart) return
    setInjuries((prev) => [
      ...prev,
      { bodyPart: draft.bodyPart!, severity: draft.severity ?? 'MILD', description: draft.description ?? '' },
    ])
    setDraft({ severity: 'MILD' })
    setAdding(false)
  }

  const remove = (i: number) => setInjuries((prev) => prev.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="flex gap-3 rounded-xl border border-[#C8F135]/20 bg-[#C8F135]/5 p-4">
        <ShieldAlert className="size-5 text-[#C8F135] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-white">L&apos;IA protège tes zones sensibles</p>
          <p className="text-xs text-zinc-400 mt-0.5">
            Les exercices sollicitant tes zones blessées seront automatiquement exclus ou adaptés dans chaque programme.
          </p>
        </div>
      </div>

      {/* Current injuries */}
      {injuries.length > 0 && (
        <div className="space-y-2">
          {injuries.map((inj, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{inj.bodyPart}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${SEVERITY_LABELS[inj.severity].color}`}>
                    {SEVERITY_LABELS[inj.severity].label}
                  </span>
                  {inj.description && (
                    <span className="text-xs text-zinc-500 truncate">{inj.description}</span>
                  )}
                </div>
              </div>
              <button type="button" onClick={() => remove(i)} className="ml-3 text-zinc-600 hover:text-red-400 transition-colors">
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add injury form */}
      {adding ? (
        <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Zone concernée</label>
            <select
              value={draft.bodyPart ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, bodyPart: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#C8F135] transition-colors"
            >
              <option value="">Choisir une zone…</option>
              {BODY_PARTS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Sévérité</label>
            <div className="grid grid-cols-3 gap-2">
              {(['MILD', 'MODERATE', 'SEVERE'] as const).map((sev) => (
                <button key={sev} type="button"
                  onClick={() => setDraft((d) => ({ ...d, severity: sev }))}
                  className={`py-2 rounded-xl border text-xs font-medium transition-all ${
                    draft.severity === sev
                      ? SEVERITY_LABELS[sev].color
                      : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {SEVERITY_LABELS[sev].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Précision <span className="text-zinc-600">(optionnel)</span></label>
            <input
              type="text"
              placeholder="ex : douleur à l'extension, post-opération…"
              value={draft.description ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135] transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setAdding(false)}
              className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors">
              Annuler
            </button>
            <button type="button" onClick={addInjury} disabled={!draft.bodyPart}
              className="flex-1 py-2.5 rounded-xl bg-[#C8F135] text-zinc-900 text-sm font-semibold disabled:opacity-40 hover:bg-[#d4f54d] transition-colors">
              Ajouter
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-zinc-700 text-zinc-400 text-sm hover:border-zinc-500 hover:text-zinc-300 transition-colors">
          <Plus className="size-4" /> Ajouter une zone à ménager
        </button>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onBack}
          className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 transition-colors">
          ← Retour
        </button>
        <button type="button" onClick={() => onNext({ injuries })}
          className="flex-1 py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-bold hover:bg-[#d4f54d] transition-colors">
          {injuries.length === 0 ? 'Aucune blessure →' : 'Continuer →'}
        </button>
      </div>
    </div>
  )
}
