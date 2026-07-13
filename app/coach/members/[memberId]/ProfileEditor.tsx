'use client'

import { useState } from 'react'
import { Edit3, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { useLocale } from '@/contexts/LocaleContext'
import { ACTIVITY_LABEL_KEYS, GOAL_LABEL_KEYS, LEVEL_LABEL_KEYS } from '@/lib/i18n/profile-label-keys'

interface Profile {
  firstName: string; age: number; gender: string
  weightKg: number; heightCm: number; targetWeightKg?: number | null
  activityLevel: string; fitnessGoal: string; fitnessLevel: string
  trainingDaysPerWeek: number; availableEquipment: string[]
  bmi?: number | null; tdee?: number | null
}

interface Props { memberId: string; profile: Profile | null }

/** Editable member profile form: displays current physical stats and allows the coach to update them via PATCH /api/coach/members/[memberId]. */
export function ProfileEditor({ memberId, profile }: Props) {
  const { locale, t } = useLocale()
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [form, setForm] = useState<Partial<Profile>>(profile ?? {})

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/coach/members/${memberId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setEditing(false)
      toast.success(t('coachMemberProfile.updated'))
    } catch {
      toast.error(t('coachMemberProfile.updateError'))
    } finally {
      setSaving(false)
    }
  }

  if (!profile) return <p className="text-xs text-zinc-600 italic">{t('coachMemberProfile.empty')}</p>

  const goalOptions = Object.entries(GOAL_LABEL_KEYS).map(([value, key]) => [value, t(key)] as const)
  const levelOptions = Object.entries(LEVEL_LABEL_KEYS).map(([value, key]) => [value, t(key)] as const)
  const activityOptions = Object.entries(ACTIVITY_LABEL_KEYS).map(([value, key]) => [value, t(key)] as const)

  const rows = [
    { k: t('coachMemberProfile.goal'),     v: editing ? undefined : (t(GOAL_LABEL_KEYS[profile.fitnessGoal] ?? '') || profile.fitnessGoal), highlight: true, field: 'fitnessGoal', options: goalOptions },
    { k: t('coachMemberProfile.age'),      v: editing ? undefined : `${profile.age} ${t('coachMemberProfile.years')}`, field: 'age', type: 'number' },
    { k: t('coachMemberProfile.weight'),   v: editing ? undefined : `${profile.weightKg} kg`, field: 'weightKg', type: 'number' },
    { k: t('coachMemberProfile.targetWeight'), v: editing ? undefined : profile.targetWeightKg ? `${profile.targetWeightKg} kg` : '—', field: 'targetWeightKg', type: 'number' },
    { k: t('coachMemberProfile.height'),   v: editing ? undefined : `${profile.heightCm} cm`, field: 'heightCm', type: 'number' },
    { k: t('coachMemberProfile.bmi'),      v: editing ? undefined : profile.bmi ? `${profile.bmi?.toFixed(1)} — ${profile.bmi < 18.5 ? t('coachMemberProfile.bmiLow') : profile.bmi < 25 ? t('coachMemberProfile.bmiNormal') : profile.bmi < 30 ? t('coachMemberProfile.bmiOverweight') : t('coachMemberProfile.bmiObesity')}` : '—', readOnly: true },
    { k: t('coachMemberProfile.caloriesPerDay'), v: editing ? undefined : profile.tdee ? `${Math.round(profile.tdee).toLocaleString(locale === 'en' ? 'en-US' : 'fr-FR')} kcal` : '—', readOnly: true },
    { k: t('coachMemberProfile.level'),    v: editing ? undefined : (t(LEVEL_LABEL_KEYS[profile.fitnessLevel] ?? '') || profile.fitnessLevel), field: 'fitnessLevel', options: levelOptions },
    { k: t('coachMemberProfile.activity'), v: editing ? undefined : (t(ACTIVITY_LABEL_KEYS[profile.activityLevel] ?? '') || profile.activityLevel), field: 'activityLevel', options: activityOptions },
    { k: t('coachMemberProfile.availableDays'), v: editing ? undefined : `${profile.trainingDaysPerWeek} / ${t('coachMemberProfile.week')}`, field: 'trainingDaysPerWeek', type: 'number' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">{t('coachMemberProfile.title')}</p>
        {editing ? (
          <div className="flex gap-2">
            <button type="button" onClick={handleSave} disabled={saving}
              className="flex items-center gap-1 text-[10px] text-[#C8F135] hover:text-[#d4f54d]">
              <Save className="size-3" /> {t('common.save')}
            </button>
            <button type="button" onClick={() => { setEditing(false); setForm(profile) }}
              className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-white">
              <X className="size-3" /> {t('common.cancel')}
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-white transition-colors">
            <Edit3 className="size-3" /> {t('common.edit')}
          </button>
        )}
      </div>

      <div className="space-y-0">
        {rows.map(r => (
          <div key={r.k} className="flex items-center justify-between py-2 border-b border-zinc-800/60 last:border-0">
            <span className="text-xs text-zinc-500 shrink-0">{r.k}</span>
            {editing && !r.readOnly && r.field ? (
              r.options ? (
                <select
                  value={String(form[r.field as keyof Profile] ?? '')}
                  onChange={e => setForm(f => ({ ...f, [r.field!]: e.target.value }))}
                  className="text-xs bg-zinc-800 border border-zinc-700 text-white px-2 py-1 rounded-lg focus:outline-none focus:border-[#C8F135] max-w-[55%]"
                >
                  {r.options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                </select>
              ) : (
                <input
                  type={r.type ?? 'text'}
                  value={String(form[r.field as keyof Profile] ?? '')}
                  onChange={e => setForm(f => ({ ...f, [r.field!]: r.type === 'number' ? Number(e.target.value) : e.target.value }))}
                  className="text-xs bg-zinc-800 border border-zinc-700 text-white px-2 py-1 rounded-lg focus:outline-none focus:border-[#C8F135] max-w-[55%] w-24"
                />
              )
            ) : (
              <span className={`text-right font-mono text-xs font-medium ${r.highlight ? 'text-[#C8F135]' : 'text-white'}`}>
                {r.v}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
