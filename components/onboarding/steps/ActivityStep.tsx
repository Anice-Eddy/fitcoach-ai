'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { activitySchema, type ActivityData } from '@/utils/validators'
import { useState } from 'react'
import { Home, Dumbbell, Building2, TreePine } from 'lucide-react'
import { useLocale } from '@/contexts/LocaleContext'
import { translateOnboardingError } from '../validation-errors'

interface Props {
  defaultValues?: Partial<ActivityData>
  onNext: (data: ActivityData) => void
  onBack: () => void
}

const ACTIVITY_OPTIONS = [
  { value: 'SEDENTARY',         labelKey: 'onboarding.activityStep.levels.sedentary.label', descKey: 'onboarding.activityStep.levels.sedentary.description' },
  { value: 'LIGHTLY_ACTIVE',    labelKey: 'onboarding.activityStep.levels.light.label',     descKey: 'onboarding.activityStep.levels.light.description' },
  { value: 'MODERATELY_ACTIVE', labelKey: 'onboarding.activityStep.levels.moderate.label',  descKey: 'onboarding.activityStep.levels.moderate.description' },
  { value: 'VERY_ACTIVE',       labelKey: 'onboarding.activityStep.levels.very.label',      descKey: 'onboarding.activityStep.levels.very.description' },
  { value: 'EXTREMELY_ACTIVE',  labelKey: 'onboarding.activityStep.levels.extreme.label',   descKey: 'onboarding.activityStep.levels.extreme.description' },
]

// Training location -> equipment inferred automatically.
const TRAINING_PLACES = [
  {
    id:        'home_bw',
    labelKey:  'onboarding.activityStep.places.homeBodyweight.label',
    subKey:    'onboarding.activityStep.places.homeBodyweight.description',
    icon:      Home,
    equipment: ['BODYWEIGHT'],
  },
  {
    id:        'home_gear',
    labelKey:  'onboarding.activityStep.places.homeGear.label',
    subKey:    'onboarding.activityStep.places.homeGear.description',
    icon:      Dumbbell,
    equipment: ['BODYWEIGHT', 'DUMBBELL', 'KETTLEBELL', 'RESISTANCE_BAND', 'PULL_UP_BAR'],
  },
  {
    id:        'gym',
    labelKey:  'onboarding.activityStep.places.gym.label',
    subKey:    'onboarding.activityStep.places.gym.description',
    icon:      Building2,
    equipment: ['BARBELL', 'DUMBBELL', 'KETTLEBELL', 'BENCH', 'CABLE_MACHINE', 'SMITH_MACHINE', 'CARDIO_MACHINE', 'PULL_UP_BAR', 'BODYWEIGHT'],
  },
  {
    id:        'outdoor',
    labelKey:  'onboarding.activityStep.places.outdoor.label',
    subKey:    'onboarding.activityStep.places.outdoor.description',
    icon:      TreePine,
    equipment: ['BODYWEIGHT', 'PULL_UP_BAR', 'RESISTANCE_BAND'],
  },
]

/** Onboarding step for selecting activity level, training place (auto-fills equipment), and training days per week. */
export function ActivityStep({ defaultValues, onNext, onBack }: Props) {
  const { t } = useLocale()
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ActivityData>({
    resolver:      zodResolver(activitySchema),
    defaultValues: defaultValues ?? { trainingDaysPerWeek: 3, availableEquipment: ['BODYWEIGHT'] },
  })

  const activity = watch('activityLevel')
  const days     = watch('trainingDaysPerWeek')
  const dayLabel = t(days > 1 ? 'onboarding.activityStep.days' : 'onboarding.activityStep.day')

  // Multiple locations can be selected; rebuild UI state from saved equipment.
  const [placeIds, setPlaceIds] = useState<string[]>(() => {
    const eq = (defaultValues?.availableEquipment ?? []) as string[]
    const ids: string[] = []
    if (eq.includes('BARBELL')) ids.push('gym')
    if (eq.includes('DUMBBELL') && !eq.includes('BARBELL')) ids.push('home_gear')
    if (eq.includes('RESISTANCE_BAND') && !eq.includes('DUMBBELL') && !eq.includes('BARBELL')) ids.push('outdoor')
    if (eq.length === 1 && eq[0] === 'BODYWEIGHT') ids.push('home_bw')
    return ids
  })

  // Each location contributes equipment; merge without duplicates before validating the form.
  const togglePlace = (place: typeof TRAINING_PLACES[number]) => {
    const newIds = placeIds.includes(place.id)
      ? placeIds.filter(id => id !== place.id)
      : [...placeIds, place.id]
    setPlaceIds(newIds)
    const union = Array.from(new Set(
      TRAINING_PLACES.filter(p => newIds.includes(p.id)).flatMap(p => p.equipment),
    ))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue('availableEquipment', union as any)
  }

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">

      {/* Training location */}
      <div>
        <label className="block text-sm font-semibold text-zinc-300 mb-3">
          {t('onboarding.activityStep.trainingPlace')}
        </label>
        <div className="grid grid-cols-2 gap-3">
          {TRAINING_PLACES.map((place) => {
            const Icon   = place.icon
            const active = placeIds.includes(place.id)
            return (
              <button
                key={place.id}
                type="button"
                onClick={() => togglePlace(place)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  active
                    ? 'border-[#C8F135] bg-[#C8F135]/10'
                    : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`size-5 ${active ? 'text-[#C8F135]' : 'text-zinc-400'}`} />
                  <div className={`size-4 rounded border-2 flex items-center justify-center ${active ? 'border-[#C8F135] bg-[#C8F135]' : 'border-zinc-600'}`}>
                    {active && <svg className="size-2.5 text-zinc-950" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                </div>
                <p className={`text-sm font-semibold ${active ? 'text-[#C8F135]' : 'text-white'}`}>
                  {t(place.labelKey)}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5 leading-snug">{t(place.subKey)}</p>
              </button>
            )
          })}
        </div>
        {errors.availableEquipment && (
          <p className="mt-1.5 text-xs text-red-400">{t('onboarding.activityStep.placeRequired')}</p>
        )}
      </div>

      {/* Activity level */}
      <div>
        <label className="block text-sm font-semibold text-zinc-300 mb-3">
          {t('onboarding.activityStep.activityLevel')}
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
                  {t(opt.labelKey)}
                </p>
                <p className="text-xs text-zinc-400">{t(opt.descKey)}</p>
              </div>
            </button>
          ))}
        </div>
        {errors.activityLevel && (
          <p className="mt-1.5 text-xs text-red-400">{translateOnboardingError(errors.activityLevel.message, t)}</p>
        )}
      </div>

      {/* Weekly training days */}
      <div>
        <label className="block text-sm font-semibold text-zinc-300 mb-3">
          {t('onboarding.activityStep.trainingDays')}{' '}
          <span className="text-[#C8F135] font-bold">{days} {dayLabel}</span>
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
          {t('onboarding.back')}
        </button>
        <button type="submit"
          className="flex-1 py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-bold hover:bg-[#d4f54d] transition-colors">
          {t('onboarding.continue')}
        </button>
      </div>
    </form>
  )
}
