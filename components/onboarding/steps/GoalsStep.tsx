'use client'
// Étape 4 : objectif principal, poids cible optionnel, niveau sportif

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { goalsSchema, type GoalsData } from '@/utils/validators'

interface Props {
  defaultValues?: Partial<GoalsData>
  onNext: (data: GoalsData) => void
  onBack: () => void
}

const GOAL_OPTIONS = [
  { value: 'WEIGHT_LOSS',     emoji: '🔥', label: 'Perte de poids',     desc: 'Déficit de 500 kcal/jour' },
  { value: 'MUSCLE_GAIN',     emoji: '💪', label: 'Prise de masse',      desc: 'Surplus de 300 kcal/jour' },
  { value: 'MAINTENANCE',     emoji: '⚖️', label: 'Maintien',            desc: 'Calories = TDEE' },
  { value: 'ENDURANCE',       emoji: '🏃', label: 'Endurance',           desc: 'Performance cardio' },
  { value: 'GENERAL_FITNESS', emoji: '🎯', label: 'Forme générale',      desc: 'Santé et bien-être' },
  { value: 'FLEXIBILITY',     emoji: '🧘', label: 'Souplesse / Mobilité', desc: 'Yoga, étirements' },
]

const LEVEL_OPTIONS = [
  { value: 'BEGINNER',     label: 'Débutant',     desc: '< 6 mois' },
  { value: 'INTERMEDIATE', label: 'Intermédiaire', desc: '6 mois – 2 ans' },
  { value: 'ADVANCED',     label: 'Avancé',        desc: '2 – 5 ans' },
  { value: 'ATHLETE',      label: 'Athlète',       desc: '5 ans+' },
]

export function GoalsStep({ defaultValues, onNext, onBack }: Props) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<GoalsData>({
    resolver:      zodResolver(goalsSchema),
    defaultValues: defaultValues ?? { fitnessLevel: 'BEGINNER' },
  })

  const goal  = watch('fitnessGoal')
  const level = watch('fitnessLevel')

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      {/* Objectif principal */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-3">Objectif principal</label>
        <div className="grid grid-cols-2 gap-2">
          {GOAL_OPTIONS.map((opt) => (
            <button key={opt.value} type="button"
              onClick={() => setValue('fitnessGoal', opt.value as GoalsData['fitnessGoal'])}
              className={`p-3 rounded-xl border text-left transition-all ${
                goal === opt.value
                  ? 'border-[#C8F135] bg-[#C8F135]/10'
                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <div className="text-xl mb-1">{opt.emoji}</div>
              <p className={`text-xs font-semibold ${goal === opt.value ? 'text-[#C8F135]' : 'text-white'}`}>{opt.label}</p>
              <p className="text-xs text-zinc-500">{opt.desc}</p>
            </button>
          ))}
        </div>
        {errors.fitnessGoal && <p className="mt-1.5 text-xs text-red-400">{errors.fitnessGoal.message}</p>}
      </div>

      {/* Poids cible (optionnel, affiché si perte/prise de masse) */}
      {(goal === 'WEIGHT_LOSS' || goal === 'MUSCLE_GAIN') && (
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Poids cible <span className="text-zinc-500">(optionnel, en kg)</span>
          </label>
          <input {...register('targetWeightKg', { valueAsNumber: true })} type="number" step="0.5" placeholder="65"
            className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#C8F135] transition-colors"
          />
        </div>
      )}

      {/* Niveau sportif */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-3">Niveau sportif</label>
        <div className="grid grid-cols-2 gap-2">
          {LEVEL_OPTIONS.map((opt) => (
            <button key={opt.value} type="button"
              onClick={() => setValue('fitnessLevel', opt.value as GoalsData['fitnessLevel'])}
              className={`p-3 rounded-xl border text-left transition-all ${
                level === opt.value
                  ? 'border-[#C8F135] bg-[#C8F135]/10'
                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <p className={`text-sm font-semibold ${level === opt.value ? 'text-[#C8F135]' : 'text-white'}`}>{opt.label}</p>
              <p className="text-xs text-zinc-500">{opt.desc}</p>
            </button>
          ))}
        </div>
        {errors.fitnessLevel && <p className="mt-1.5 text-xs text-red-400">{errors.fitnessLevel.message}</p>}
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 transition-colors">← Retour</button>
        <button type="submit" className="flex-1 py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-bold hover:bg-[#d4f54d] transition-colors">Continuer →</button>
      </div>
    </form>
  )
}
