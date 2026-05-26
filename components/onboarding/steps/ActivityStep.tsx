'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { activitySchema, type ActivityData } from '@/utils/validators'
import { useState } from 'react'
import { Home, Dumbbell, Building2, TreePine } from 'lucide-react'

interface Props {
  defaultValues?: Partial<ActivityData>
  onNext: (data: ActivityData) => void
  onBack: () => void
}

const ACTIVITY_OPTIONS = [
  { value: 'SEDENTARY',         label: 'Sédentaire',        desc: 'Bureau, peu ou pas d\'exercice' },
  { value: 'LIGHTLY_ACTIVE',    label: 'Légèrement actif',  desc: 'Sport 1–3 j/semaine' },
  { value: 'MODERATELY_ACTIVE', label: 'Modérément actif',  desc: 'Sport 3–5 j/semaine' },
  { value: 'VERY_ACTIVE',       label: 'Très actif',        desc: 'Sport intensif 6–7 j/semaine' },
  { value: 'EXTREMELY_ACTIVE',  label: 'Extrêmement actif', desc: 'Athlète, 2×/jour' },
]

// Lieu d'entraînement → équipement déduit automatiquement
const TRAINING_PLACES = [
  {
    id:        'home_bw',
    label:     'À la maison',
    sub:       'Sans matériel',
    icon:      Home,
    equipment: ['BODYWEIGHT'],
  },
  {
    id:        'home_gear',
    label:     'À la maison',
    sub:       'Avec matériel (haltères, bandes…)',
    icon:      Dumbbell,
    equipment: ['BODYWEIGHT', 'DUMBBELL', 'KETTLEBELL', 'RESISTANCE_BAND', 'PULL_UP_BAR'],
  },
  {
    id:        'gym',
    label:     'En salle de sport',
    sub:       'Accès à tout l\'équipement',
    icon:      Building2,
    equipment: ['BARBELL', 'DUMBBELL', 'KETTLEBELL', 'BENCH', 'CABLE_MACHINE', 'SMITH_MACHINE', 'CARDIO_MACHINE', 'PULL_UP_BAR', 'BODYWEIGHT'],
  },
  {
    id:        'outdoor',
    label:     'En extérieur',
    sub:       'Parcs, calisthenics, course',
    icon:      TreePine,
    equipment: ['BODYWEIGHT', 'PULL_UP_BAR', 'RESISTANCE_BAND'],
  },
]

export function ActivityStep({ defaultValues, onNext, onBack }: Props) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ActivityData>({
    resolver:      zodResolver(activitySchema),
    defaultValues: defaultValues ?? { trainingDaysPerWeek: 3, availableEquipment: ['BODYWEIGHT'] },
  })

  const activity = watch('activityLevel')
  const days     = watch('trainingDaysPerWeek')

  // On garde juste l'ID du lieu sélectionné pour l'UI
  const [placeId, setPlaceId] = useState<string>(() => {
    // Retrouve le lieu depuis l'équipement existant si on revient en arrière
    const eq = defaultValues?.availableEquipment as string[] | undefined
    if (!eq?.length) return ''
    if (eq.includes('BARBELL')) return 'gym'
    if (eq.includes('DUMBBELL')) return 'home_gear'
    if (eq.length === 1 && eq[0] === 'BODYWEIGHT') return 'home_bw'
    return 'outdoor'
  })

  const selectPlace = (place: typeof TRAINING_PLACES[number]) => {
    if (placeId === place.id) {
      setPlaceId('')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setValue('availableEquipment', [] as any)
    } else {
      setPlaceId(place.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setValue('availableEquipment', place.equipment as any)
    }
  }

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">

      {/* Lieu d'entraînement */}
      <div>
        <label className="block text-sm font-semibold text-zinc-300 mb-3">
          Où t'entraînes-tu ?
        </label>
        <div className="grid grid-cols-2 gap-3">
          {TRAINING_PLACES.map((place) => {
            const Icon   = place.icon
            const active = placeId === place.id
            return (
              <button
                key={place.id}
                type="button"
                onClick={() => selectPlace(place)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  active
                    ? 'border-[#C8F135] bg-[#C8F135]/10'
                    : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                }`}
              >
                <Icon className={`size-5 mb-2 ${active ? 'text-[#C8F135]' : 'text-zinc-400'}`} />
                <p className={`text-sm font-semibold ${active ? 'text-[#C8F135]' : 'text-white'}`}>
                  {place.label}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5 leading-snug">{place.sub}</p>
              </button>
            )
          })}
        </div>
        {errors.availableEquipment && (
          <p className="mt-1.5 text-xs text-red-400">Choisis un lieu d'entraînement</p>
        )}
      </div>

      {/* Niveau d'activité */}
      <div>
        <label className="block text-sm font-semibold text-zinc-300 mb-3">
          Ton niveau d'activité actuel
        </label>
        <div className="space-y-2">
          {ACTIVITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setValue('activityLevel', activity === opt.value ? (undefined as unknown as ActivityData['activityLevel']) : opt.value as ActivityData['activityLevel'])}
              className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                activity === opt.value
                  ? 'border-[#C8F135] bg-[#C8F135]/10'
                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <div className={`size-4 mt-0.5 rounded-full border-2 shrink-0 transition-colors ${
                activity === opt.value ? 'border-[#C8F135] bg-[#C8F135]' : 'border-zinc-600'
              }`} />
              <div>
                <p className={`text-sm font-medium ${activity === opt.value ? 'text-[#C8F135]' : 'text-white'}`}>
                  {opt.label}
                </p>
                <p className="text-xs text-zinc-400">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
        {errors.activityLevel && (
          <p className="mt-1.5 text-xs text-red-400">{errors.activityLevel.message}</p>
        )}
      </div>

      {/* Jours par semaine */}
      <div>
        <label className="block text-sm font-semibold text-zinc-300 mb-3">
          Jours d'entraînement par semaine :{' '}
          <span className="text-[#C8F135] font-bold">{days} jour{days > 1 ? 's' : ''}</span>
        </label>
        <input
          {...register('trainingDaysPerWeek', { valueAsNumber: true })}
          type="range" min={1} max={7}
          className="w-full accent-[#C8F135] cursor-pointer"
        />
        <div className="flex justify-between text-xs text-zinc-500 mt-1.5 px-0.5">
          {[1,2,3,4,5,6,7].map((d) => (
            <span key={d} className={d === days ? 'text-[#C8F135] font-bold' : ''}>{d}</span>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onBack}
          className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 transition-colors">
          ← Retour
        </button>
        <button type="submit"
          className="flex-1 py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-bold hover:bg-[#d4f54d] transition-colors">
          Continuer →
        </button>
      </div>
    </form>
  )
}
