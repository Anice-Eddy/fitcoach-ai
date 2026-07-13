'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { goalsSchema, type GoalsData } from '@/utils/validators'
import { Flame, Dumbbell, Scale, Activity, Target, Leaf, ChevronsUp, ChevronsDown, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useLocale } from '@/contexts/LocaleContext'
import { translateOnboardingError } from '../validation-errors'

interface Props {
  defaultValues?: Partial<GoalsData>
  onNext: (data: GoalsData) => void
  onBack: () => void
}

const GOAL_OPTIONS: { value: string; icon: LucideIcon; labelKey: string; descKey: string }[] = [
  { value: 'WEIGHT_LOSS',     icon: Flame,    labelKey: 'onboarding.goalsStep.goals.weightLoss.label',     descKey: 'onboarding.goalsStep.goals.weightLoss.description' },
  { value: 'MUSCLE_GAIN',     icon: Dumbbell, labelKey: 'onboarding.goalsStep.goals.muscleGain.label',     descKey: 'onboarding.goalsStep.goals.muscleGain.description' },
  { value: 'MAINTENANCE',     icon: Scale,    labelKey: 'onboarding.goalsStep.goals.maintenance.label',    descKey: 'onboarding.goalsStep.goals.maintenance.description' },
  { value: 'ENDURANCE',       icon: Activity, labelKey: 'onboarding.goalsStep.goals.endurance.label',      descKey: 'onboarding.goalsStep.goals.endurance.description' },
  { value: 'GENERAL_FITNESS', icon: Target,   labelKey: 'onboarding.goalsStep.goals.generalFitness.label', descKey: 'onboarding.goalsStep.goals.generalFitness.description' },
  { value: 'FLEXIBILITY',     icon: Leaf,     labelKey: 'onboarding.goalsStep.goals.flexibility.label',    descKey: 'onboarding.goalsStep.goals.flexibility.description' },
]

const LEVEL_OPTIONS = [
  { value: 'BEGINNER',     labelKey: 'onboarding.goalsStep.levels.beginner.label',     descKey: 'onboarding.goalsStep.levels.beginner.description' },
  { value: 'INTERMEDIATE', labelKey: 'onboarding.goalsStep.levels.intermediate.label', descKey: 'onboarding.goalsStep.levels.intermediate.description' },
  { value: 'ADVANCED',     labelKey: 'onboarding.goalsStep.levels.advanced.label',     descKey: 'onboarding.goalsStep.levels.advanced.description' },
  { value: 'ATHLETE',      labelKey: 'onboarding.goalsStep.levels.athlete.label',      descKey: 'onboarding.goalsStep.levels.athlete.description' },
]

const FOCUS_OPTIONS: { value: string; icon: LucideIcon; labelKey: string; descKey: string }[] = [
  { value: 'UPPER_BODY', icon: ChevronsUp,   labelKey: 'onboarding.goalsStep.focus.upper.label', descKey: 'onboarding.goalsStep.focus.upper.description' },
  { value: 'LOWER_BODY', icon: ChevronsDown, labelKey: 'onboarding.goalsStep.focus.lower.label', descKey: 'onboarding.goalsStep.focus.lower.description' },
  { value: 'FULL_BODY',  icon: Zap,          labelKey: 'onboarding.goalsStep.focus.full.label',  descKey: 'onboarding.goalsStep.focus.full.description' },
]

export function GoalsStep({ defaultValues, onNext, onBack }: Props) {
  const { t } = useLocale()
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<GoalsData>({
    resolver:      zodResolver(goalsSchema),
    defaultValues: defaultValues ?? { fitnessLevel: 'BEGINNER' },
  })

  const goal  = watch('fitnessGoal')
  const level = watch('fitnessLevel')
  const focus = watch('bodyFocus')

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      {/* Main goal */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-3">{t('onboarding.goalsStep.mainGoal')}</label>
        <div className="grid grid-cols-2 gap-2">
          {GOAL_OPTIONS.map((opt) => {
            const Icon     = opt.icon
            const isActive = goal === opt.value
            return (
              <button key={opt.value} type="button"
                onClick={() => setValue('fitnessGoal', isActive ? (undefined as unknown as GoalsData['fitnessGoal']) : opt.value as GoalsData['fitnessGoal'])}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isActive ? 'border-[#C8F135] bg-[#C8F135]/10' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                }`}
              >
                <div className="mb-1.5">
                  <Icon className={`size-5 ${isActive ? 'text-[#C8F135]' : 'text-zinc-400'}`} />
                </div>
                <p className={`text-xs font-semibold ${isActive ? 'text-[#C8F135]' : 'text-white'}`}>{t(opt.labelKey)}</p>
                <p className="text-xs text-zinc-500">{t(opt.descKey)}</p>
              </button>
            )
          })}
        </div>
        {errors.fitnessGoal && <p className="mt-1.5 text-xs text-red-400">{translateOnboardingError(errors.fitnessGoal.message, t)}</p>}
      </div>

      {/* Optional target weight */}
      {(goal === 'WEIGHT_LOSS' || goal === 'MUSCLE_GAIN') && (
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            {t('onboarding.goalsStep.targetWeight')} <span className="text-zinc-500">{t('onboarding.goalsStep.targetWeightOptional')}</span>
          </label>
          <input {...register('targetWeightKg')} type="number" step="0.5" placeholder="65"
            className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#C8F135] transition-colors"
          />
        </div>
      )}

      {/* Fitness level */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-3">{t('onboarding.goalsStep.fitnessLevel')}</label>
        <div className="grid grid-cols-2 gap-2">
          {LEVEL_OPTIONS.map((opt) => (
            <button key={opt.value} type="button"
              onClick={() => setValue('fitnessLevel', level === opt.value ? (undefined as unknown as GoalsData['fitnessLevel']) : opt.value as GoalsData['fitnessLevel'])}
              className={`p-3 rounded-xl border text-left transition-all ${
                level === opt.value ? 'border-[#C8F135] bg-[#C8F135]/10' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <p className={`text-sm font-semibold ${level === opt.value ? 'text-[#C8F135]' : 'text-white'}`}>{t(opt.labelKey)}</p>
              <p className="text-xs text-zinc-500">{t(opt.descKey)}</p>
            </button>
          ))}
        </div>
        {errors.fitnessLevel && <p className="mt-1.5 text-xs text-red-400">{translateOnboardingError(errors.fitnessLevel.message, t)}</p>}
      </div>

      {/* Body focus */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          {t('onboarding.goalsStep.bodyFocus')}
        </label>
        <p className="text-xs text-zinc-500 mb-3">{t('onboarding.goalsStep.bodyFocusDescription')}</p>
        <div className="grid grid-cols-3 gap-2">
          {FOCUS_OPTIONS.map((opt) => {
            const Icon     = opt.icon
            const isActive = focus === opt.value
            return (
              <button key={opt.value} type="button"
                onClick={() => setValue('bodyFocus', isActive ? undefined : opt.value as GoalsData['bodyFocus'])}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isActive ? 'border-[#C8F135] bg-[#C8F135]/10' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                }`}
              >
                <div className="mb-1.5">
                  <Icon className={`size-5 ${isActive ? 'text-[#C8F135]' : 'text-zinc-400'}`} />
                </div>
                <p className={`text-xs font-semibold ${isActive ? 'text-[#C8F135]' : 'text-white'}`}>{t(opt.labelKey)}</p>
                <p className="text-xs text-zinc-500 leading-tight">{t(opt.descKey)}</p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 transition-colors">{t('onboarding.back')}</button>
        <button type="submit" className="flex-1 py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-bold hover:bg-[#d4f54d] transition-colors">{t('onboarding.continue')}</button>
      </div>
    </form>
  )
}
