'use client'
// Étape 5 : restrictions alimentaires et préférences

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { dietSchema, type DietData } from '@/utils/validators'

interface Props {
  defaultValues?: Partial<DietData>
  onNext: (data: DietData) => void
  onBack: () => void
}

const RESTRICTIONS = ['Végétarien', 'Végan', 'Sans gluten', 'Sans lactose', 'Halal', 'Casher', 'Sans noix', 'Sans porc']
const PREFERENCES  = ['Viande blanche', 'Poisson', 'Œufs', 'Légumineuses', 'Riz', 'Pâtes', 'Pommes de terre', 'Légumes verts', 'Fruits', 'Produits laitiers']

/** Onboarding step for selecting dietary restrictions and food preferences from predefined option chips. */
export function DietStep({ defaultValues, onNext, onBack }: Props) {
  const { handleSubmit, watch, setValue } = useForm<DietData>({
    resolver:      zodResolver(dietSchema),
    defaultValues: defaultValues ?? { dietaryRestrictions: [], foodPreferences: [] },
  })

  const restrictions = watch('dietaryRestrictions') ?? []
  const preferences  = watch('foodPreferences') ?? []

  const toggle = (field: 'dietaryRestrictions' | 'foodPreferences', val: string) => {
    const current = field === 'dietaryRestrictions' ? restrictions : preferences
    setValue(field, current.includes(val) ? current.filter((v) => v !== val) : [...current, val])
  }

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-3">
          Restrictions alimentaires <span className="text-zinc-500">(optionnel)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {RESTRICTIONS.map((r) => {
            const active = restrictions.includes(r)
            return (
              <button key={r} type="button" onClick={() => toggle('dietaryRestrictions', r)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  active ? 'border-red-400 bg-red-400/10 text-red-400' : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                }`}
              >{r}</button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-3">
          Aliments que tu aimes <span className="text-zinc-500">(optionnel)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {PREFERENCES.map((p) => {
            const active = preferences.includes(p)
            return (
              <button key={p} type="button" onClick={() => toggle('foodPreferences', p)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  active ? 'border-[#C8F135] bg-[#C8F135]/10 text-[#C8F135]' : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                }`}
              >{p}</button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 transition-colors">← Retour</button>
        <button type="submit" className="flex-1 py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-bold hover:bg-[#d4f54d] transition-colors">Voir mon résumé →</button>
      </div>
    </form>
  )
}
