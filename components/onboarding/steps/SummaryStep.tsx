'use client'
// Final onboarding step: calculated BMI, daily calories, and macros.

import { motion } from 'framer-motion'
import { calculateFitnessProfile, getBMICategory } from '@/utils/fitness-calculations'
import { MacroRing } from '@/components/ui/MacroRing'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { OnboardingData } from '@/utils/validators'
import type { ActivityLevel, FitnessGoal, Gender } from '@/types'
import { useLocale } from '@/contexts/LocaleContext'
import { GOAL_LABEL_KEYS } from '@/lib/i18n/profile-label-keys'

interface Props {
  data:      OnboardingData
  onFinish:  () => void
  onBack:    () => void
  isLoading: boolean
}

/** Final onboarding step: displays the calculated BMI, TDEE, and macro targets, then calls onFinish to save the profile. */
export function SummaryStep({ data, onFinish, onBack, isLoading }: Props) {
  const { locale, t } = useLocale()
  const result = calculateFitnessProfile({
    weightKg:      data.weightKg,
    heightCm:      data.heightCm,
    age:           data.age,
    gender:        data.gender as Gender,
    activityLevel: data.activityLevel as ActivityLevel,
    fitnessGoal:   data.fitnessGoal as FitnessGoal,
  })

  const bmiCategory = getBMICategory(result.bmi, locale)
  const goalLabel = GOAL_LABEL_KEYS[data.fitnessGoal] ? t(GOAL_LABEL_KEYS[data.fitnessGoal]) : data.fitnessGoal

  return (
    <div className="space-y-5">
      <p className="text-zinc-400 text-sm">{t('onboarding.summaryStep.description')}</p>

      {/* BMI */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl bg-zinc-800 p-4 border border-zinc-700"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-400">{t('onboarding.summaryStep.bmi')}</span>
          <span className="text-lg font-bold text-white">{result.bmi}</span>
        </div>
        <ProgressBar value={result.bmi} max={40} color={bmiCategory.color} size="sm" />
        <div className="flex items-center gap-2 mt-2">
          <div className="size-2.5 rounded-full" style={{ backgroundColor: bmiCategory.color }} />
          <span className="text-xs font-medium" style={{ color: bmiCategory.color }}>{bmiCategory.label}</span>
          <span className="text-xs text-zinc-500 ml-auto">{bmiCategory.range}</span>
        </div>
      </motion.div>

      {/* Metabolism */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="grid grid-cols-2 gap-3"
      >
        {[
          { label: t('onboarding.summaryStep.restingCalories'),  value: result.bmr,  unit: t('onboarding.summaryStep.kcalShort'), desc: t('onboarding.summaryStep.restingCaloriesDescription') },
          { label: t('onboarding.summaryStep.dailyExpenditure'), value: result.tdee, unit: t('onboarding.summaryStep.kcalShort'), desc: t('onboarding.summaryStep.dailyExpenditureDescription') },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-zinc-800 p-4 border border-zinc-700">
            <p className="text-xs text-zinc-500 mb-1">{item.label}</p>
            <p className="text-xl font-bold text-white">{item.value} <span className="text-xs text-zinc-400">{item.unit}</span></p>
            <p className="text-xs text-zinc-500">{item.desc}</p>
          </div>
        ))}
      </motion.div>

      {/* Recommended calories */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-2xl bg-[#C8F135]/5 border border-[#C8F135]/20 p-4"
      >
        <p className="text-xs text-zinc-400 mb-1">{t('onboarding.summaryStep.recommendedCalories')} — {goalLabel}</p>
        <p className="text-3xl font-bold text-[#C8F135]">
          {result.recommendedCalories} <span className="text-lg text-zinc-400">{t('onboarding.summaryStep.kcalPerDay')}</span>
        </p>
      </motion.div>

      {/* Macros */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="rounded-2xl bg-zinc-800 p-4 border border-zinc-700"
      >
        <p className="text-sm text-zinc-400 mb-4">{t('onboarding.summaryStep.macroSplit')}</p>
        <MacroRing proteinG={result.proteinG} carbsG={result.carbsG} fatG={result.fatG} />
      </motion.div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 transition-colors">{t('onboarding.back')}</button>
        <button
          onClick={onFinish}
          disabled={isLoading}
          className="flex-1 py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-bold hover:bg-[#d4f54d] transition-colors disabled:opacity-60"
        >
          {isLoading ? t('onboarding.summaryStep.saving') : t('onboarding.summaryStep.start')}
        </button>
      </div>
    </div>
  )
}
