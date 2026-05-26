'use client'
// Étape 1 : identité — prénom, âge, sexe

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { identitySchema, type IdentityData } from '@/utils/validators'

interface Props {
  defaultValues?: Partial<IdentityData>
  onNext: (data: IdentityData) => void
  onBack?: () => void
}

const GENDER_OPTIONS = [
  { value: 'MALE',   label: 'Homme' },
  { value: 'FEMALE', label: 'Femme' },
  { value: 'OTHER',  label: 'Autre' },
]

export function IdentityStep({ defaultValues, onNext, onBack }: Props) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<IdentityData>({
    resolver:      zodResolver(identitySchema),
    defaultValues: defaultValues ?? { gender: 'MALE' },
  })
  const gender = watch('gender')

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Prénom</label>
        <input
          {...register('firstName')}
          placeholder="Ton prénom"
          className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors"
        />
        {errors.firstName && <p className="mt-1.5 text-xs text-red-400">{errors.firstName.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Âge</label>
        <input
          {...register('age', { valueAsNumber: true })}
          type="number" min={13} max={100} placeholder="25"
          className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors"
        />
        {errors.age && <p className="mt-1.5 text-xs text-red-400">{errors.age.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-3">Sexe</label>
        <div className="grid grid-cols-3 gap-3">
          {GENDER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setValue('gender', opt.value as IdentityData['gender'])}
              className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                gender === opt.value
                  ? 'border-[#C8F135] bg-[#C8F135]/10 text-[#C8F135]'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        {onBack && (
          <button type="button" onClick={onBack}
            className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 transition-colors">
            ← Retour
          </button>
        )}
        <button type="submit"
          className="flex-1 py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-bold hover:bg-[#d4f54d] transition-colors">
          Continuer →
        </button>
      </div>
    </form>
  )
}
