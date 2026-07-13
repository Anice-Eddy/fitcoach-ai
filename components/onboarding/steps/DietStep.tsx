'use client'
// Step 5: dietary restrictions and preferences.

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { dietSchema, type DietData } from '@/utils/validators'
import { useLocale } from '@/contexts/LocaleContext'

interface Props {
  defaultValues?: Partial<DietData>
  onNext: (data: DietData) => void
  onBack: () => void
}

const RESTRICTIONS = [
  { value: 'Végétarien', key: 'onboarding.diet.restrictionsOptions.vegetarian' },
  { value: 'Végan', key: 'onboarding.diet.restrictionsOptions.vegan' },
  { value: 'Sans gluten', key: 'onboarding.diet.restrictionsOptions.glutenFree' },
  { value: 'Sans lactose', key: 'onboarding.diet.restrictionsOptions.lactoseFree' },
  { value: 'Halal', key: 'onboarding.diet.restrictionsOptions.halal' },
  { value: 'Casher', key: 'onboarding.diet.restrictionsOptions.kosher' },
  { value: 'Sans noix', key: 'onboarding.diet.restrictionsOptions.nutFree' },
  { value: 'Sans porc', key: 'onboarding.diet.restrictionsOptions.porkFree' },
]
const PREFERENCES = [
  { value: 'Viande blanche', key: 'onboarding.diet.preferencesOptions.whiteMeat' },
  { value: 'Poisson', key: 'onboarding.diet.preferencesOptions.fish' },
  { value: 'Œufs', key: 'onboarding.diet.preferencesOptions.eggs' },
  { value: 'Légumineuses', key: 'onboarding.diet.preferencesOptions.legumes' },
  { value: 'Riz', key: 'onboarding.diet.preferencesOptions.rice' },
  { value: 'Pâtes', key: 'onboarding.diet.preferencesOptions.pasta' },
  { value: 'Pommes de terre', key: 'onboarding.diet.preferencesOptions.potatoes' },
  { value: 'Légumes verts', key: 'onboarding.diet.preferencesOptions.greenVegetables' },
  { value: 'Fruits', key: 'onboarding.diet.preferencesOptions.fruits' },
  { value: 'Produits laitiers', key: 'onboarding.diet.preferencesOptions.dairy' },
]

/** Onboarding step for selecting dietary restrictions and food preferences from predefined option chips. */
export function DietStep({ defaultValues, onNext, onBack }: Props) {
  const { t } = useLocale()
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
          {t('onboarding.diet.restrictions')} <span className="text-zinc-500">({t('onboarding.optional')})</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {RESTRICTIONS.map((r) => {
            const active = restrictions.includes(r.value)
            return (
              <button key={r.value} type="button" onClick={() => toggle('dietaryRestrictions', r.value)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  active ? 'border-red-400 bg-red-400/10 text-red-400' : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                }`}
              >{t(r.key)}</button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-3">
          {t('onboarding.diet.preferences')} <span className="text-zinc-500">({t('onboarding.optional')})</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {PREFERENCES.map((p) => {
            const active = preferences.includes(p.value)
            return (
              <button key={p.value} type="button" onClick={() => toggle('foodPreferences', p.value)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  active ? 'border-[#C8F135] bg-[#C8F135]/10 text-[#C8F135]' : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                }`}
              >{t(p.key)}</button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 transition-colors">{t('onboarding.back')}</button>
        <button type="submit" className="flex-1 py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-bold hover:bg-[#d4f54d] transition-colors">{t('onboarding.diet.showSummary')}</button>
      </div>
    </form>
  )
}
