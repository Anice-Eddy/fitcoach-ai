'use client'
// Step 5: Health & injuries - protected areas for AI.

import { useState } from 'react'
import { X, Plus, ShieldAlert } from 'lucide-react'
import type { HealthData, InjuryEntry } from '@/utils/validators'
import { useLocale } from '@/contexts/LocaleContext'

interface Props {
  defaultValues?: Partial<HealthData>
  onNext: (data: HealthData) => void
  onBack: () => void
}

const BODY_PARTS = [
  { value: 'Épaule gauche', key: 'onboarding.health.bodyParts.leftShoulder' },
  { value: 'Épaule droite', key: 'onboarding.health.bodyParts.rightShoulder' },
  { value: 'Coude gauche', key: 'onboarding.health.bodyParts.leftElbow' },
  { value: 'Coude droit', key: 'onboarding.health.bodyParts.rightElbow' },
  { value: 'Poignet gauche', key: 'onboarding.health.bodyParts.leftWrist' },
  { value: 'Poignet droit', key: 'onboarding.health.bodyParts.rightWrist' },
  { value: 'Dos / Lombaires', key: 'onboarding.health.bodyParts.lowerBack' },
  { value: 'Nuque / Cervicales', key: 'onboarding.health.bodyParts.neck' },
  { value: 'Genou gauche', key: 'onboarding.health.bodyParts.leftKnee' },
  { value: 'Genou droit', key: 'onboarding.health.bodyParts.rightKnee' },
  { value: 'Cheville gauche', key: 'onboarding.health.bodyParts.leftAnkle' },
  { value: 'Cheville droite', key: 'onboarding.health.bodyParts.rightAnkle' },
  { value: 'Hanche gauche', key: 'onboarding.health.bodyParts.leftHip' },
  { value: 'Hanche droite', key: 'onboarding.health.bodyParts.rightHip' },
  { value: 'Pectoraux', key: 'onboarding.health.bodyParts.chest' },
  { value: 'Abdominaux', key: 'onboarding.health.bodyParts.abs' },
]

const SEVERITY_STYLES: Record<InjuryEntry['severity'], { labelKey: string; color: string }> = {
  MILD:     { labelKey: 'onboarding.health.severityLabels.mild',     color: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10' },
  MODERATE: { labelKey: 'onboarding.health.severityLabels.moderate', color: 'text-orange-400 border-orange-400/40 bg-orange-400/10' },
  SEVERE:   { labelKey: 'onboarding.health.severityLabels.severe',   color: 'text-red-400 border-red-400/40 bg-red-400/10' },
}

/** Onboarding step to declare injuries or pain zones so the AI avoids/adapts exercises. */
export function HealthStep({ defaultValues, onNext, onBack }: Props) {
  const { t } = useLocale()
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
  const bodyPartLabel = (value: string) => t(BODY_PARTS.find(part => part.value === value)?.key ?? value)

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="flex gap-3 rounded-xl border border-[#C8F135]/20 bg-[#C8F135]/5 p-4">
        <ShieldAlert className="size-5 text-[#C8F135] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-white">{t('onboarding.health.title')}</p>
          <p className="text-xs text-zinc-400 mt-0.5">
            {t('onboarding.health.description')}
          </p>
        </div>
      </div>

      {/* Current injuries */}
      {injuries.length > 0 && (
        <div className="space-y-2">
          {injuries.map((inj, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{bodyPartLabel(inj.bodyPart)}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${SEVERITY_STYLES[inj.severity].color}`}>
                    {t(SEVERITY_STYLES[inj.severity].labelKey)}
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
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('onboarding.health.bodyPart')}</label>
            <select
              value={draft.bodyPart ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, bodyPart: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#C8F135] transition-colors"
            >
              <option value="">{t('onboarding.health.chooseBodyPart')}</option>
              {BODY_PARTS.map((p) => <option key={p.value} value={p.value}>{t(p.key)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('onboarding.health.severity')}</label>
            <div className="grid grid-cols-3 gap-2">
              {(['MILD', 'MODERATE', 'SEVERE'] as const).map((sev) => (
                <button key={sev} type="button"
                  onClick={() => setDraft((d) => ({ ...d, severity: sev }))}
                  className={`py-2 rounded-xl border text-xs font-medium transition-all ${
                    draft.severity === sev
                      ? SEVERITY_STYLES[sev].color
                      : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {t(SEVERITY_STYLES[sev].labelKey)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('onboarding.health.details')} <span className="text-zinc-600">({t('onboarding.optional')})</span></label>
            <input
              type="text"
              placeholder={t('onboarding.health.detailsPlaceholder')}
              value={draft.description ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135] transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setAdding(false)}
              className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors">
              {t('common.cancel')}
            </button>
            <button type="button" onClick={addInjury} disabled={!draft.bodyPart}
              className="flex-1 py-2.5 rounded-xl bg-[#C8F135] text-zinc-900 text-sm font-semibold disabled:opacity-40 hover:bg-[#d4f54d] transition-colors">
              {t('common.add')}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-zinc-700 text-zinc-400 text-sm hover:border-zinc-500 hover:text-zinc-300 transition-colors">
          <Plus className="size-4" /> {t('onboarding.health.addProtectedArea')}
        </button>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onBack}
          className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 transition-colors">
          {t('onboarding.back')}
        </button>
        <button type="button" onClick={() => onNext({ injuries })}
          className="flex-1 py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-bold hover:bg-[#d4f54d] transition-colors">
          {injuries.length === 0 ? t('onboarding.health.noInjury') : t('onboarding.continue')}
        </button>
      </div>
    </div>
  )
}
