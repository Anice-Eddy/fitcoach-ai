'use client'
// Étape 2 : mensurations avec conversion temps réel kg↔lb et cm↔ft/pouces

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { measurementsSchema, type MeasurementsData } from '@/utils/validators'
import { kgToLb, lbToKg, cmToFtIn, ftInToCm } from '@/utils/unit-conversions'
import { useEffect, useState } from 'react'

interface Props {
  defaultValues?: Partial<MeasurementsData>
  onNext: (data: MeasurementsData) => void
  onBack: () => void
}

export function MeasurementsStep({ defaultValues, onNext, onBack }: Props) {
  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<MeasurementsData>({
    resolver:      zodResolver(measurementsSchema),
    defaultValues: defaultValues ?? { weightUnit: 'KG', heightUnit: 'CM' },
  })

  const weightUnit = watch('weightUnit')
  const heightUnit = watch('heightUnit')
  const weightKg   = watch('weightKg')
  const heightCm   = watch('heightCm')

  const [lbDisplay, setLbDisplay] = useState('')
  const [ftDisplay, setFtDisplay] = useState({ feet: '', inches: '' })

  // Synchronise l'affichage en lb quand on modifie en kg
  useEffect(() => {
    if (weightKg) setLbDisplay(String(kgToLb(weightKg)))
  }, [weightKg])

  // Synchronise l'affichage en ft/in quand on modifie en cm
  useEffect(() => {
    if (heightCm) {
      const { feet, inches } = cmToFtIn(heightCm)
      setFtDisplay({ feet: String(feet), inches: String(inches) })
    }
  }, [heightCm])

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      {/* Poids */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-zinc-300">Poids</label>
          <div className="flex rounded-lg overflow-hidden border border-zinc-700">
            {(['KG', 'LB'] as const).map((u) => (
              <button key={u} type="button"
                onClick={() => setValue('weightUnit', u)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${weightUnit === u ? 'bg-[#C8F135] text-zinc-900' : 'bg-zinc-800 text-zinc-400'}`}
              >{u}</button>
            ))}
          </div>
        </div>
        {weightUnit === 'KG' ? (
          <input {...register('weightKg', { valueAsNumber: true })} type="number" step="0.1" placeholder="70"
            className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#C8F135] transition-colors"
          />
        ) : (
          <input type="number" step="0.1" placeholder="154" value={lbDisplay}
            onChange={(e) => { setLbDisplay(e.target.value); setValue('weightKg', lbToKg(parseFloat(e.target.value) || 0)) }}
            className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#C8F135] transition-colors"
          />
        )}
        {errors.weightKg && <p className="mt-1.5 text-xs text-red-400">{errors.weightKg.message}</p>}
      </div>

      {/* Taille */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-zinc-300">Taille</label>
          <div className="flex rounded-lg overflow-hidden border border-zinc-700">
            {(['CM', 'FT_IN'] as const).map((u) => (
              <button key={u} type="button"
                onClick={() => setValue('heightUnit', u)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${heightUnit === u ? 'bg-[#C8F135] text-zinc-900' : 'bg-zinc-800 text-zinc-400'}`}
              >{u === 'CM' ? 'cm' : 'ft/in'}</button>
            ))}
          </div>
        </div>
        {heightUnit === 'CM' ? (
          <input {...register('heightCm', { valueAsNumber: true })} type="number" placeholder="175"
            className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#C8F135] transition-colors"
          />
        ) : (
          <div className="flex gap-2">
            <input type="number" placeholder="5" value={ftDisplay.feet}
              onChange={(e) => { const f = { ...ftDisplay, feet: e.target.value }; setFtDisplay(f); setValue('heightCm', ftInToCm(parseFloat(f.feet)||0, parseFloat(f.inches)||0)) }}
              className="w-1/2 px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#C8F135] transition-colors"
            />
            <input type="number" placeholder="9" value={ftDisplay.inches}
              onChange={(e) => { const f = { ...ftDisplay, inches: e.target.value }; setFtDisplay(f); setValue('heightCm', ftInToCm(parseFloat(f.feet)||0, parseFloat(f.inches)||0)) }}
              className="w-1/2 px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#C8F135] transition-colors"
            />
          </div>
        )}
        {errors.heightCm && <p className="mt-1.5 text-xs text-red-400">{errors.heightCm.message}</p>}
      </div>

      {/* Tour de taille et hanches (optionnels) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Tour de taille <span className="text-zinc-500">(opt.)</span></label>
          <input {...register('waistCm', { valueAsNumber: true })} type="number" placeholder="80 cm"
            className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#C8F135] transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Tour de hanches <span className="text-zinc-500">(opt.)</span></label>
          <input {...register('hipsCm', { valueAsNumber: true })} type="number" placeholder="95 cm"
            className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#C8F135] transition-colors"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button type="button" onClick={onBack} className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 transition-colors">← Retour</button>
        <button type="submit" className="flex-1 py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-bold hover:bg-[#d4f54d] transition-colors">Continuer →</button>
      </div>
    </form>
  )
}
