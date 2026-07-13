'use client'

import { useCallback, useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { useUserStore } from '@/stores/userStore'
import { bodyMetricSchema } from '@/utils/validators'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import { useLocale } from '@/contexts/LocaleContext'
import { ACTIVITY_LABEL_KEYS, EQUIPMENT_LABEL_KEYS, GENDER_LABEL_KEYS, GOAL_LABEL_KEYS, LEVEL_LABEL_KEYS } from '@/lib/i18n/profile-label-keys'

const ACTIVITY = ['SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTREMELY_ACTIVE']
const GOALS = ['WEIGHT_LOSS', 'MUSCLE_GAIN', 'MAINTENANCE', 'ENDURANCE', 'FLEXIBILITY', 'GENERAL_FITNESS']
const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ATHLETE']
const EQUIPMENT = ['BODYWEIGHT', 'DUMBBELL', 'KETTLEBELL', 'RESISTANCE_BAND', 'PULL_UP_BAR', 'BARBELL', 'BENCH', 'CABLE_MACHINE', 'SMITH_MACHINE', 'CARDIO_MACHINE']

type MetricHistoryItem = { weightKg: number; date?: string | Date }

/** Body measurements settings page: allows updating weight, height, waist, hips, and body fat; displays historical weight chart. */
export default function BodySettingsPage() {
  const { locale, t } = useLocale()
  const { profile, setProfile } = useUserStore()
  const [saving, setSaving] = useState(false)
  const [metrics, setMetrics] = useState<MetricHistoryItem[]>([])
  const [form, setForm] = useState({
    weightKg: String(profile?.weightKg ?? ''),
    heightCm: String(profile?.heightCm ?? ''),
    waistCm: String(profile?.waistCm ?? ''),
    hipsCm: String(profile?.hipsCm ?? ''),
    weightUnit: profile?.weightUnit ?? 'KG',
    heightUnit: profile?.heightUnit ?? 'CM',
    age: String(profile?.age ?? ''),
    gender: profile?.gender ?? 'MALE',
    activityLevel: profile?.activityLevel ?? 'MODERATELY_ACTIVE',
    trainingDaysPerWeek: String(profile?.trainingDaysPerWeek ?? 3),
    fitnessGoal: profile?.fitnessGoal ?? 'MAINTENANCE',
    targetWeightKg: String(profile?.targetWeightKg ?? ''),
    fitnessLevel: profile?.fitnessLevel ?? 'BEGINNER',
    dietaryRestrictions: (profile?.dietaryRestrictions ?? []).join(', '),
    foodPreferences: (profile?.foodPreferences ?? []).join(', '),
    availableEquipment: profile?.availableEquipment ?? ['BODYWEIGHT'],
  })

  const loadMetrics = useCallback(async () => {
    // History comes from the API to stay synchronized across dashboard, coach, and AI.
    const res = await fetch('/api/user/metrics?limit=10')
    if (res.ok) setMetrics(await res.json())
  }, [])

  useEffect(() => { loadMetrics().catch(() => undefined) }, [loadMetrics])

  const set = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }))

  const save = async () => {
    const payload = {
      weightKg: Number(form.weightKg),
      heightCm: Number(form.heightCm),
      waistCm: form.waistCm ? Number(form.waistCm) : undefined,
      hipsCm: form.hipsCm ? Number(form.hipsCm) : undefined,
      weightUnit: form.weightUnit,
      heightUnit: form.heightUnit,
      age: Number(form.age),
      gender: form.gender,
      activityLevel: form.activityLevel,
      trainingDaysPerWeek: Number(form.trainingDaysPerWeek),
      fitnessGoal: form.fitnessGoal,
      targetWeightKg: form.targetWeightKg ? Number(form.targetWeightKg) : undefined,
      fitnessLevel: form.fitnessLevel,
      availableEquipment: form.availableEquipment,
      dietaryRestrictions: form.dietaryRestrictions.split(',').map((v) => v.trim()).filter(Boolean),
      foodPreferences: form.foodPreferences.split(',').map((v) => v.trim()).filter(Boolean),
    }

    const metric = bodyMetricSchema.safeParse({
      weightKg: payload.weightKg,
      waistCm: payload.waistCm,
      hipsCm: payload.hipsCm,
    })
    if (!metric.success) {
      toast.error(t('settings.bodySaveOutOfRange'))
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setProfile(updated)
      const metricRes = await fetch('/api/user/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric.data),
      })
      if (!metricRes.ok) throw new Error()
      await loadMetrics()
      toast.success(t('settings.bodyUpdated'))
    } catch {
      toast.error(t('settings.bodySaveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Header title={t('settings.bodyInfoTitle')} />
      <PageWrapper>
        <div className="max-w-3xl space-y-6">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-[22px] font-medium text-white">{t('settings.bodyInfo')}</h1>
              <button type="button" onClick={save} disabled={saving} aria-label={t('settings.saveBody')} className="flex items-center gap-2 rounded-xl bg-[#C8F135] px-4 py-2.5 text-sm font-bold text-zinc-900 transition-colors hover:bg-[#d4f54d] disabled:opacity-50">
                <Save className="size-4" /> {saving ? t('settings.saving') : t('common.save')}
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ['weightKg', t('settings.currentWeight'), 'number'],
                ['heightCm', t('settings.height'), 'number'],
                ['waistCm', t('settings.waist'), 'number'],
                ['hipsCm', t('settings.hips'), 'number'],
                ['age', t('settings.age'), 'number'],
                ['trainingDaysPerWeek', t('settings.trainingDaysPerWeek'), 'number'],
                ['targetWeightKg', t('settings.targetWeight'), 'number'],
              ].map(([key, label, type]) => (
                <label key={key} className="grid gap-1.5">
                  <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">{label}</span>
                  <input type={type} value={String(form[key as keyof typeof form])} onChange={(e) => set(key, e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#C8F135]" />
                </label>
              ))}

              <Select label={t('settings.weightUnits')} value={form.weightUnit} options={['KG', 'LB']} onChange={(v) => set('weightUnit', v)} />
              <Select label={t('settings.heightUnits')} value={form.heightUnit} options={['CM', 'FT_IN']} onChange={(v) => set('heightUnit', v)} />
              <Select label={t('settings.gender')} value={form.gender} options={['MALE', 'FEMALE']} onChange={(v) => set('gender', v)} getOptionLabel={(value) => t(GENDER_LABEL_KEYS[value] ?? value)} />
              <Select label={t('settings.activity')} value={form.activityLevel} options={ACTIVITY} onChange={(v) => set('activityLevel', v)} getOptionLabel={(value) => t(ACTIVITY_LABEL_KEYS[value] ?? value)} />
              <Select label={t('settings.goal')} value={form.fitnessGoal} options={GOALS} onChange={(v) => set('fitnessGoal', v)} getOptionLabel={(value) => t(GOAL_LABEL_KEYS[value] ?? value)} />
              <Select label={t('settings.fitnessLevel')} value={form.fitnessLevel} options={LEVELS} onChange={(v) => set('fitnessLevel', v)} getOptionLabel={(value) => t(LEVEL_LABEL_KEYS[value] ?? value)} />
            </div>

            <div className="mt-4 grid gap-4">
              <label className="grid gap-1.5">
                <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">{t('settings.availableEquipment')}</span>
                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT.map((item) => {
                    const active = form.availableEquipment.includes(item)
                    return (
                      <button key={item} type="button" onClick={() => set('availableEquipment', active ? form.availableEquipment.filter((v) => v !== item) : [...form.availableEquipment, item])} aria-label={`${t('settings.toggleEquipment')} ${t(EQUIPMENT_LABEL_KEYS[item] ?? item)}`} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${active ? 'border-[#C8F135] bg-[#C8F135]/10 text-[#C8F135]' : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'}`}>
                        {t(EQUIPMENT_LABEL_KEYS[item] ?? item)}
                      </button>
                    )
                  })}
                </div>
              </label>
              <TextArea label={t('settings.dietaryRestrictions')} value={form.dietaryRestrictions} onChange={(v) => set('dietaryRestrictions', v)} />
              <TextArea label={t('settings.foodPreferences')} value={form.foodPreferences} onChange={(v) => set('foodPreferences', v)} />
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-base font-medium text-white">{t('settings.weightHistory')}</h2>
            <div className="mt-4 space-y-2">
              {metrics.length === 0 ? (
                <p className="text-sm text-zinc-500">{t('settings.noMeasurement')}</p>
              ) : metrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between rounded-xl bg-zinc-800 px-4 py-3">
                  <span className="text-xs text-zinc-500">{metric.date ? new Date(metric.date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US') : t('settings.today')}</span>
                  <span className="font-mono text-sm font-medium text-white">{metric.weightKg} kg</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </PageWrapper>
    </>
  )
}

function Select({ label, value, options, onChange, getOptionLabel = (option) => option }: { label: string; value: string; options: string[]; onChange: (value: string) => void; getOptionLabel?: (value: string) => string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#C8F135]">
        {options.map((option) => <option key={option} value={option}>{getOptionLabel(option)}</option>)}
      </select>
    </label>
  )
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#C8F135]" />
    </label>
  )
}
