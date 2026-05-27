'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { useUserStore } from '@/stores/userStore'
import { toast } from 'sonner'

/** Preferences settings page: lets the user change weight/height unit system and save the preference. */
export default function PreferencesPage() {
  const { profile, updateProfile } = useUserStore()
  const [weightUnit, setWeightUnitState] = useState<'KG' | 'LB'>(profile?.weightUnit ?? 'KG')
  const [heightUnit, setHeightUnitState] = useState<'CM' | 'FT_IN'>(profile?.heightUnit ?? 'CM')

  const saveUnit = async (field: 'weightUnit' | 'heightUnit', value: string) => {
    updateProfile({ [field]: value })
    await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    }).catch(() => null)
    toast.success('Préférences mises à jour')
  }

  const handleWeightUnit = (unit: 'KG' | 'LB') => {
    setWeightUnitState(unit)
    saveUnit('weightUnit', unit)
  }

  const handleHeightUnit = (unit: 'CM' | 'FT_IN') => {
    setHeightUnitState(unit)
    saveUnit('heightUnit', unit)
  }

  return (
    <>
      <Header title="Préférences" />
      <PageWrapper>
        <div className="max-w-2xl space-y-6">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h1 className="text-[22px] font-medium text-white">Préférences</h1>
            <div className="mt-6 space-y-5">

              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.5px] text-zinc-500">Unité de poids</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['KG', 'LB'] as const).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => handleWeightUnit(unit)}
                      aria-label={`Poids en ${unit}`}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                        weightUnit === unit
                          ? 'border-[#C8F135] bg-[#C8F135]/10 text-[#C8F135]'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white'
                      }`}
                    >
                      {unit === 'KG' ? 'Kilogrammes (kg)' : 'Livres (lb)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.5px] text-zinc-500">Unité de taille</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['CM', 'FT_IN'] as const).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => handleHeightUnit(unit)}
                      aria-label={`Taille en ${unit}`}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                        heightUnit === unit
                          ? 'border-[#C8F135] bg-[#C8F135]/10 text-[#C8F135]'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white'
                      }`}
                    >
                      {unit === 'CM' ? 'Centimètres (cm)' : 'Pieds/Pouces (ft/in)'}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </section>
        </div>
      </PageWrapper>
    </>
  )
}
