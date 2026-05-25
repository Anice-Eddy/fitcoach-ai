'use client'
// Étape 3 : niveau d'activité, équipement disponible, jours d'entraînement

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { activitySchema, type ActivityData } from '@/utils/validators'

interface Props {
  defaultValues?: Partial<ActivityData>
  onNext: (data: ActivityData) => void
  onBack: () => void
}

const ACTIVITY_OPTIONS = [
  { value: 'SEDENTARY',         label: 'Sédentaire',          desc: 'Bureau, peu ou pas d\'exercice' },
  { value: 'LIGHTLY_ACTIVE',    label: 'Légèrement actif',    desc: 'Sport 1-3j/semaine' },
  { value: 'MODERATELY_ACTIVE', label: 'Modérément actif',    desc: 'Sport 3-5j/semaine' },
  { value: 'VERY_ACTIVE',       label: 'Très actif',          desc: 'Sport intensif 6-7j/semaine' },
  { value: 'EXTREMELY_ACTIVE',  label: 'Extrêmement actif',   desc: 'Athlète, 2x/jour' },
]

const EQUIPMENT_OPTIONS = [
  { value: 'BODYWEIGHT',     label: 'Poids du corps' },
  { value: 'DUMBBELL',       label: 'Haltères' },
  { value: 'BARBELL',        label: 'Barre olympique' },
  { value: 'KETTLEBELL',     label: 'Kettlebell' },
  { value: 'RESISTANCE_BAND',label: 'Bandes élastiques' },
  { value: 'PULL_UP_BAR',    label: 'Barre de traction' },
  { value: 'BENCH',          label: 'Banc' },
  { value: 'CABLE_MACHINE',  label: 'Poulie / câble' },
  { value: 'CARDIO_MACHINE', label: 'Cardio machine' },
]

export function ActivityStep({ defaultValues, onNext, onBack }: Props) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ActivityData>({
    resolver:      zodResolver(activitySchema),
    defaultValues: defaultValues ?? { trainingDaysPerWeek: 3, availableEquipment: ['BODYWEIGHT'] },
  })

  const activity   = watch('activityLevel')
  const equipment  = watch('availableEquipment') ?? []
  const days       = watch('trainingDaysPerWeek')

  const toggleEquipment = (val: string) => {
    const current = (equipment ?? []) as string[]
    const next    = current.includes(val)
      ? current.filter((e) => e !== val)
      : [...current, val]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue('availableEquipment', next as any)
  }

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      {/* Niveau d'activité */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-3">Niveau d'activité actuel</label>
        <div className="space-y-2">
          {ACTIVITY_OPTIONS.map((opt) => (
            <button key={opt.value} type="button"
              onClick={() => setValue('activityLevel', opt.value as ActivityData['activityLevel'])}
              className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                activity === opt.value
                  ? 'border-[#C8F135] bg-[#C8F135]/10'
                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <div className={`size-4 mt-0.5 rounded-full border-2 shrink-0 transition-colors ${activity === opt.value ? 'border-[#C8F135] bg-[#C8F135]' : 'border-zinc-600'}`} />
              <div>
                <p className={`text-sm font-medium ${activity === opt.value ? 'text-[#C8F135]' : 'text-white'}`}>{opt.label}</p>
                <p className="text-xs text-zinc-400">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
        {errors.activityLevel && <p className="mt-1.5 text-xs text-red-400">{errors.activityLevel.message}</p>}
      </div>

      {/* Équipement */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-3">Équipement disponible</label>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_OPTIONS.map((opt) => {
            const active = (equipment as string[]).includes(opt.value)
            return (
              <button key={opt.value} type="button" onClick={() => toggleEquipment(opt.value)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  active ? 'border-[#C8F135] bg-[#C8F135]/10 text-[#C8F135]' : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                }`}
              >{opt.label}</button>
            )
          })}
        </div>
        {errors.availableEquipment && <p className="mt-1.5 text-xs text-red-400">{errors.availableEquipment.message}</p>}
      </div>

      {/* Jours par semaine */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-3">
          Jours d'entraînement par semaine : <span className="text-[#C8F135]">{days}</span>
        </label>
        <input {...register('trainingDaysPerWeek', { valueAsNumber: true })} type="range" min={1} max={7}
          className="w-full accent-[#C8F135]"
        />
        <div className="flex justify-between text-xs text-zinc-500 mt-1">
          {[1,2,3,4,5,6,7].map((d) => <span key={d}>{d}</span>)}
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 transition-colors">← Retour</button>
        <button type="submit" className="flex-1 py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-bold hover:bg-[#d4f54d] transition-colors">Continuer →</button>
      </div>
    </form>
  )
}
