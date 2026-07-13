'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { measurementsSchema, type MeasurementsData } from '@/utils/validators'
import { kgToLb, lbToKg, cmToFtIn, ftInToCm } from '@/utils/unit-conversions'
import { useEffect, useState } from 'react'
import { useLocale } from '@/contexts/LocaleContext'
import { translateOnboardingError } from '../validation-errors'

interface Props {
  defaultValues?: Partial<MeasurementsData>
  weightUnit:  'KG' | 'LB'
  heightUnit:  'CM' | 'FT_IN'
  onNext: (data: MeasurementsData) => void
  onBack: () => void
}

/** Onboarding step for entering weight, height, and optional waist/hip measurements with live unit conversion display. */
export function MeasurementsStep({ defaultValues, weightUnit, heightUnit, onNext, onBack }: Props) {
  const { t } = useLocale()
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<MeasurementsData>({
    resolver:      zodResolver(measurementsSchema),
    defaultValues: { ...defaultValues, weightUnit, heightUnit },
  })

  const weightKg = watch('weightKg')
  const heightCm = watch('heightCm')

  const [lbDisplay,  setLbDisplay]  = useState('')
  const [ftDisplay,  setFtDisplay]  = useState({ feet: '', inches: '' })

  useEffect(() => {
    if (weightKg) setLbDisplay(String(kgToLb(weightKg)))
  }, [weightKg])

  useEffect(() => {
    if (heightCm) {
      const { feet, inches } = cmToFtIn(heightCm)
      setFtDisplay({ feet: String(feet), inches: String(inches) })
    }
  }, [heightCm])

  // Sync units into the form.
  useEffect(() => { setValue('weightUnit', weightUnit) }, [weightUnit, setValue])
  useEffect(() => { setValue('heightUnit', heightUnit) }, [heightUnit, setValue])

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">

      {/* Weight */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-zinc-300">{t('onboarding.measurements.weight')}</label>
          <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-md">
            {weightUnit === 'KG' ? 'kg' : 'lb'}
          </span>
        </div>

        {weightUnit === 'KG' ? (
          <input
            {...register('weightKg', { valueAsNumber: true })}
            type="number" step="0.1" placeholder="70"
            className="w-full px-4 py-3.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-lg font-medium focus:outline-none focus:border-[#C8F135] transition-colors"
          />
        ) : (
          <input
            type="number" step="0.1" placeholder="154" value={lbDisplay}
            onChange={(e) => {
              setLbDisplay(e.target.value)
              setValue('weightKg', lbToKg(parseFloat(e.target.value) || 0))
            }}
            className="w-full px-4 py-3.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-lg font-medium focus:outline-none focus:border-[#C8F135] transition-colors"
          />
        )}
        {errors.weightKg && <p className="mt-1.5 text-xs text-red-400">{translateOnboardingError(errors.weightKg.message, t)}</p>}
      </div>

      {/* Height */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-zinc-300">{t('onboarding.measurements.height')}</label>
          <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-md">
            {heightUnit === 'CM' ? 'cm' : 'ft / in'}
          </span>
        </div>

        {heightUnit === 'CM' ? (
          <input
            {...register('heightCm', { valueAsNumber: true })}
            type="number" placeholder="175"
            className="w-full px-4 py-3.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-lg font-medium focus:outline-none focus:border-[#C8F135] transition-colors"
          />
        ) : (
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="number" placeholder={t('onboarding.measurements.feetPlaceholder')} value={ftDisplay.feet}
                onChange={(e) => {
                  const f = { ...ftDisplay, feet: e.target.value }
                  setFtDisplay(f)
                  setValue('heightCm', ftInToCm(parseFloat(f.feet) || 0, parseFloat(f.inches) || 0))
                }}
                className="w-full px-4 py-3.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-lg font-medium focus:outline-none focus:border-[#C8F135] transition-colors"
              />
              <p className="text-xs text-zinc-500 mt-1 text-center">{t('onboarding.measurements.feet')}</p>
            </div>
            <div className="flex-1">
              <input
                type="number" placeholder={t('onboarding.measurements.inchesPlaceholder')} value={ftDisplay.inches}
                onChange={(e) => {
                  const f = { ...ftDisplay, inches: e.target.value }
                  setFtDisplay(f)
                  setValue('heightCm', ftInToCm(parseFloat(f.feet) || 0, parseFloat(f.inches) || 0))
                }}
                className="w-full px-4 py-3.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-lg font-medium focus:outline-none focus:border-[#C8F135] transition-colors"
              />
              <p className="text-xs text-zinc-500 mt-1 text-center">{t('onboarding.measurements.inches')}</p>
            </div>
          </div>
        )}
        {errors.heightCm && <p className="mt-1.5 text-xs text-red-400">{translateOnboardingError(errors.heightCm.message, t)}</p>}
      </div>

      {/* Optional waist and hip measurements */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            {t('onboarding.measurements.waist')}
            <span className="ml-1.5 text-xs text-zinc-600 font-normal">{t('onboarding.optional')}</span>
          </label>
          <input
            {...register('waistCm')}
            type="number" placeholder="80"
            className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#C8F135] transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            {t('onboarding.measurements.hips')}
            <span className="ml-1.5 text-xs text-zinc-600 font-normal">{t('onboarding.optional')}</span>
          </label>
          <input
            {...register('hipsCm')}
            type="number" placeholder="95"
            className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#C8F135] transition-colors"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
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
