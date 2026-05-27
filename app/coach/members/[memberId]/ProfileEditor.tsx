'use client'

import { useState } from 'react'
import { Edit3, Save, X } from 'lucide-react'
import { toast } from 'sonner'

interface Profile {
  firstName: string; age: number; gender: string
  weightKg: number; heightCm: number; targetWeightKg?: number | null
  activityLevel: string; fitnessGoal: string; fitnessLevel: string
  trainingDaysPerWeek: number; availableEquipment: string[]
  bmi?: number | null; tdee?: number | null
}

interface Props { memberId: string; profile: Profile | null }

const GOAL_LABELS: Record<string, string> = {
  WEIGHT_LOSS: 'Perte de poids', MUSCLE_GAIN: 'Prise de masse',
  MAINTENANCE: 'Maintien', ENDURANCE: 'Endurance',
  FLEXIBILITY: 'Flexibilité', GENERAL_FITNESS: 'Forme générale',
}
const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Débutant', INTERMEDIATE: 'Intermédiaire', ADVANCED: 'Avancé', ATHLETE: 'Athlète',
}
const ACTIVITY_LABELS: Record<string, string> = {
  SEDENTARY: 'Sédentaire', LIGHTLY_ACTIVE: 'Légèrement actif',
  MODERATELY_ACTIVE: 'Modérément actif', VERY_ACTIVE: 'Très actif',
  EXTREMELY_ACTIVE: 'Extrêmement actif',
}

/** Editable member profile form: displays current physical stats and allows the coach to update them via PATCH /api/coach/members/[memberId]. */
export function ProfileEditor({ memberId, profile }: Props) {
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
      toast.success('Profil mis à jour')
    } catch {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  if (!profile) return <p className="text-xs text-zinc-600 italic">Profil non renseigné.</p>

  const rows = [
    { k: 'Objectif',     v: editing ? undefined : (GOAL_LABELS[profile.fitnessGoal] ?? profile.fitnessGoal), highlight: true, field: 'fitnessGoal', options: Object.entries(GOAL_LABELS) },
    { k: 'Âge',          v: editing ? undefined : `${profile.age} ans`,               field: 'age',     type: 'number' },
    { k: 'Poids',        v: editing ? undefined : `${profile.weightKg} kg`,            field: 'weightKg', type: 'number' },
    { k: 'Objectif poids', v: editing ? undefined : profile.targetWeightKg ? `${profile.targetWeightKg} kg` : '—', field: 'targetWeightKg', type: 'number' },
    { k: 'Taille',       v: editing ? undefined : `${profile.heightCm} cm`,            field: 'heightCm', type: 'number' },
    { k: 'IMC',          v: editing ? undefined : profile.bmi ? `${profile.bmi?.toFixed(1)} — ${profile.bmi < 18.5 ? 'Insuffisant' : profile.bmi < 25 ? 'Normal' : profile.bmi < 30 ? 'Surpoids' : 'Obésité'}` : '—', readOnly: true },
    { k: 'Calories/jour',v: editing ? undefined : profile.tdee ? `${Math.round(profile.tdee).toLocaleString('fr-FR')} kcal` : '—', readOnly: true },
    { k: 'Niveau',       v: editing ? undefined : (LEVEL_LABELS[profile.fitnessLevel] ?? profile.fitnessLevel), field: 'fitnessLevel', options: Object.entries(LEVEL_LABELS) },
    { k: 'Activité',     v: editing ? undefined : (ACTIVITY_LABELS[profile.activityLevel] ?? profile.activityLevel), field: 'activityLevel', options: Object.entries(ACTIVITY_LABELS) },
    { k: 'Jours dispo',  v: editing ? undefined : `${profile.trainingDaysPerWeek} / semaine`, field: 'trainingDaysPerWeek', type: 'number' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Profil client</p>
        {editing ? (
          <div className="flex gap-2">
            <button type="button" onClick={handleSave} disabled={saving}
              className="flex items-center gap-1 text-[10px] text-[#C8F135] hover:text-[#d4f54d]">
              <Save className="size-3" /> Enregistrer
            </button>
            <button type="button" onClick={() => { setEditing(false); setForm(profile) }}
              className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-white">
              <X className="size-3" /> Annuler
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-white transition-colors">
            <Edit3 className="size-3" /> Modifier
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
