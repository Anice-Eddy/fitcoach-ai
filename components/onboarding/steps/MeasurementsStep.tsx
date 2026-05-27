'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { measurementsSchema, type MeasurementsData } from '@/utils/validators'
import { kgToLb, lbToKg, cmToFtIn, ftInToCm } from '@/utils/unit-conversions'
import { useEffect, useState } from 'react'

interface Props {
  defaultValues?: Partial<MeasurementsData>
  weightUnit:  'KG' | 'LB'
  heightUnit:  'CM' | 'FT_IN'
  onNext: (data: MeasurementsData) => void
  onBack: () => void
}

/** Onboarding step for entering weight, height, and optional waist/hip measurements with live unit conversion display. */
export function MeasurementsStep({ defaultValues, weightUnit, heightUnit, onNext, onBack }: Props) {
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

  // Sync unités dans le formulaire
  useEffect(() => { setValue('weightUnit', weightUnit) }, [weightUnit, setValue])
  useEffect(() => { setValue('heightUnit', heightUnit) }, [heightUnit, setValue])

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">

      {/* Poids */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-zinc-300">Poids</label>
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
        {errors.weightKg && <p className="mt-1.5 text-xs text-red-400">{errors.weightKg.message}</p>}
      </div>

      {/* Taille */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-zinc-300">Taille</label>
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
                type="number" placeholder="5 ft" value={ftDisplay.feet}
                onChange={(e) => {
                  const f = { ...ftDisplay, feet: e.target.value }
                  setFtDisplay(f)
                  setValue('heightCm', ftInToCm(parseFloat(f.feet) || 0, parseFloat(f.inches) || 0))
                }}
                className="w-full px-4 py-3.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-lg font-medium focus:outline-none focus:border-[#C8F135] transition-colors"
              />
              <p className="text-xs text-zinc-500 mt-1 text-center">pieds</p>
            </div>
            <div className="flex-1">
              <input
                type="number" placeholder="11 in" value={ftDisplay.inches}
                onChange={(e) => {
                  const f = { ...ftDisplay, inches: e.target.value }
                  setFtDisplay(f)
                  setValue('heightCm', ftInToCm(parseFloat(f.feet) || 0, parseFloat(f.inches) || 0))
                }}
                className="w-full px-4 py-3.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-lg font-medium focus:outline-none focus:border-[#C8F135] transition-colors"
              />
              <p className="text-xs text-zinc-500 mt-1 text-center">pouces</p>
            </div>
          </div>
        )}
        {errors.heightCm && <p className="mt-1.5 text-xs text-red-400">{errors.heightCm.message}</p>}
      </div>

      {/* Tour de taille et hanches (optionnels) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            Tour de taille
            <span className="ml-1.5 text-xs text-zinc-600 font-normal">optionnel</span>
          </label>
          <input
            {...register('waistCm')}
            type="number" placeholder="80"
            className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#C8F135] transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            Tour de hanches
            <span className="ml-1.5 text-xs text-zinc-600 font-normal">optionnel</span>
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
