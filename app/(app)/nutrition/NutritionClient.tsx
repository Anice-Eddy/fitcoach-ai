'use client'
// Client page nutrition — génère et affiche le plan hebdomadaire

import { useEffect, useState, useMemo } from 'react'
import { useUserStore }        from '@/stores/userStore'
import { useNutritionStore }   from '@/stores/nutritionStore'
import { generateMealPlan }    from '@/lib/nutrition/generate-meal-plan'
import { getMealsForDay, sumMacros } from '@/lib/nutrition/macro-calculator'
import { MealCard }            from '@/components/nutrition/MealCard'
import { MacroRing }           from '@/components/ui/MacroRing'
import { ProgressBar }         from '@/components/ui/ProgressBar'
import { ListSkeleton }        from '@/components/ui/LoadingSkeleton'
import { FOOD_DATABASE, calculateFoodMacros } from '@/lib/nutrition/food-database'
import type { NutritionPlan } from '@/types'
import Link from 'next/link'
import { Plus, ShoppingCart, Calculator } from 'lucide-react'

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

type ActiveNutritionTarget = {
  targetCalories: number
  targetProteinG: number
  targetCarbsG: number
  targetFatG: number
}

/** Interactive nutrition plan view: fetches or generates a weekly meal plan and allows day/meal navigation with macro summaries. */
export function NutritionClient() {
  const { profile }  = useUserStore()
  const { ensureTodayLog, logMeal, setTodayMeals } = useNutritionStore()
  const [plan, setPlan]       = useState<NutritionPlan | null>(null)
  const [coachTarget, setCoachTarget] = useState<ActiveNutritionTarget | null>(null)
  const [loading, setLoading] = useState(true)
  const [addingMeal, setAddingMeal] = useState(false)
  const [quickMeal, setQuickMeal] = useState({ name: '', calories: '', proteinG: '', carbsG: '', fatG: '' })
  const [selectedDay, setDay] = useState(0)
  // Calculateur rapide : aliment + quantité → macros instantanées
  const [calcFoodId, setCalcFoodId] = useState('')
  const [calcGrams,  setCalcGrams]  = useState('100')

  useEffect(() => {
    ensureTodayLog()
    fetch('/api/user/nutrition/logs')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data || !Array.isArray(data.logs)) return
        setTodayMeals(data.logs.map((log: {
          clientKey: string; name: string; mealType: string | null; calories: number
          proteinG: number; carbsG: number; fatG: number; loggedAt: string
        }) => ({
          mealId:   log.clientKey.replace(/^meal:/, ''),
          name:     log.name,
          type:     log.mealType ?? 'MANUAL',
          calories:  Math.round(log.calories),
          proteinG:  Math.round(log.proteinG),
          carbsG:    Math.round(log.carbsG),
          fatG:      Math.round(log.fatG),
          loggedAt:  log.loggedAt,
        })))
      })
      .catch(() => {})
    fetch('/api/user/nutrition/plan')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data?.targetCalories) return
        setCoachTarget({
          targetCalories: data.targetCalories,
          targetProteinG: data.targetProteinG,
          targetCarbsG:   data.targetCarbsG,
          targetFatG:     data.targetFatG,
        })
      })
      .catch(() => {})
    const d = new Date().getDay()
    const todayIndex = d === 0 ? 6 : d - 1
    setDay(todayIndex)
  }, [ensureTodayLog, setTodayMeals])

  useEffect(() => {
    if (!profile) { setLoading(false); return }
    const target = coachTarget ?? {
      targetCalories: profile.recommendedCalories ?? 2000,
      targetProteinG: profile.recommendedProteinG ?? 150,
      targetCarbsG:   profile.recommendedCarbsG ?? 200,
      targetFatG:     profile.recommendedFatG ?? 65,
    }
    const generated = generateMealPlan({
      targetCalories:      target.targetCalories,
      targetProteinG:      target.targetProteinG,
      targetCarbsG:        target.targetCarbsG,
      targetFatG:          target.targetFatG,
      fitnessGoal:         profile.fitnessGoal,
      dietaryRestrictions: profile.dietaryRestrictions,
    })
    setPlan(generated)
    setLoading(false)
  }, [profile, coachTarget])

  // Calcul macros en temps réel pour le calculateur rapide
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const calcResult = useMemo(() => {
    if (!calcFoodId || !calcGrams) return null
    return calculateFoodMacros(calcFoodId, parseFloat(calcGrams) || 0)
  }, [calcFoodId, calcGrams])

  if (loading) return <ListSkeleton rows={5} />

  const todayMeals = plan ? getMealsForDay(plan.meals, selectedDay) : []
  const todayTotals = sumMacros(todayMeals)
  const availableDays = 7

  // Ajoute un repas au plan affiché et le journalise si le jour sélectionné est aujourd'hui.
  const addMealToSelectedDay = (
    meal: NonNullable<NutritionPlan>['meals'][number],
    options: { clientKeyPrefix: string; source: string; items?: unknown[] },
  ) => {
    if (!plan) return
    const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
    setPlan({ ...plan, meals: [...plan.meals, meal] })

    if (selectedDay !== todayIndex) return

    logMeal({
      mealId:   meal.id,
      name:     meal.name,
      type:     meal.type,
      calories: Math.round(meal.totalCalories),
      proteinG: Math.round(meal.totalProteinG),
      carbsG:   Math.round(meal.totalCarbsG),
      fatG:     Math.round(meal.totalFatG),
      loggedAt: new Date().toISOString(),
    })

    fetch('/api/user/nutrition/logs', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        clientKey: `${options.clientKeyPrefix}:${meal.id}`,
        source:    options.source,
        mealType:  meal.type,
        name:      meal.name,
        calories:  Math.round(meal.totalCalories),
        proteinG:  Math.round(meal.totalProteinG),
        carbsG:    Math.round(meal.totalCarbsG),
        fatG:      Math.round(meal.totalFatG),
        items:     options.items ?? [],
      }),
    }).catch(() => {})
  }

  const addQuickMeal = () => {
    if (!plan || !quickMeal.name || !quickMeal.calories) return
    const meal = {
      id: `custom-${Date.now()}`,
      dayOfWeek: selectedDay,
      type: 'LUNCH' as const,
      name: quickMeal.name,
      scheduledTime: 'Libre',
      totalCalories: Number(quickMeal.calories),
      totalProteinG: Number(quickMeal.proteinG || 0),
      totalCarbsG: Number(quickMeal.carbsG || 0),
      totalFatG: Number(quickMeal.fatG || 0),
      isLogged: false,
      foodItems: [],
    }
    addMealToSelectedDay(meal, { clientKeyPrefix: 'manual', source: 'MANUAL' })
    setQuickMeal({ name: '', calories: '', proteinG: '', carbsG: '', fatG: '' })
    setAddingMeal(false)
  }

  const addCalculatedFood = () => {
    if (!plan || !calcResult || !calcFoodId) return
    const id = `food-${calcFoodId}-${Date.now()}`
    const meal = {
      id,
      dayOfWeek: selectedDay,
      type: 'LUNCH' as const,
      name: calcResult.name,
      scheduledTime: 'Libre',
      totalCalories: calcResult.calories,
      totalProteinG: calcResult.proteinG,
      totalCarbsG: calcResult.carbsG,
      totalFatG: calcResult.fatG,
      isLogged: false,
      foodItems: [{
        id: calcFoodId,
        name: calcResult.name,
        gramsAmount: calcResult.grams,
        calories: calcResult.calories,
        proteinG: calcResult.proteinG,
        carbsG: calcResult.carbsG,
        fatG: calcResult.fatG,
        fiberG: calcResult.fiberG,
      }],
    }
    addMealToSelectedDay(meal, {
      clientKeyPrefix: 'food',
      source: 'CALCULATED_FOOD',
      items: meal.foodItems,
    })
  }

  return (
    <div className="space-y-6">
      {/* Résumé macros du jour */}
      {plan && (
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Résumé du jour</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Objectif : {Math.round(plan.targetCalories)} kcal{coachTarget ? ' · défini par le coach' : ''}
              </p>
            </div>
            <Link href="/nutrition/shopping-list"
              className="flex items-center gap-1.5 text-xs text-[#C8F135] hover:underline"
              aria-label="Générer liste de courses"
            >
              <ShoppingCart className="size-3.5" /> Liste de courses
            </Link>
          </div>
          <MacroRing
            proteinG={Math.round(todayTotals.proteinG)}
            carbsG={Math.round(todayTotals.carbsG)}
            fatG={Math.round(todayTotals.fatG)}
            targetCalories={Math.round(plan.targetCalories)}
          />
          <div className="space-y-2 mt-4">
            <ProgressBar value={todayTotals.proteinG} max={plan.targetProteinG} label="Protéines" sublabel={`${Math.round(todayTotals.proteinG)}/${Math.round(plan.targetProteinG)}g`} color="#C8F135" size="sm" />
            <ProgressBar value={todayTotals.carbsG}   max={plan.targetCarbsG}   label="Glucides"  sublabel={`${Math.round(todayTotals.carbsG)}/${Math.round(plan.targetCarbsG)}g`}   color="#38bdf8" size="sm" />
            <ProgressBar value={todayTotals.fatG}     max={plan.targetFatG}     label="Lipides"   sublabel={`${Math.round(todayTotals.fatG)}/${Math.round(plan.targetFatG)}g`}     color="#f472b6" size="sm" />
          </div>
        </div>
      )}

      {/* Sélecteur de jour */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {DAYS.slice(0, availableDays).map((day, i) => (
          <button key={i} onClick={() => setDay(i)}
            className={`flex-1 min-w-[44px] py-2 rounded-xl text-xs font-medium transition-colors ${
              selectedDay === i ? 'bg-[#C8F135] text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >{day}</button>
        ))}
      </div>

      {/* Repas du jour */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setAddingMeal((value) => !value)}
          aria-label="Ajouter un repas"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
        >
          <Plus className="size-4" /> Ajouter un repas
        </button>

        {addingMeal && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="grid gap-3 sm:grid-cols-7">
              <input value={quickMeal.name} onChange={(e) => setQuickMeal({ ...quickMeal, name: e.target.value })} placeholder="Nom" className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-[#C8F135] sm:col-span-2" />
              <input value={quickMeal.calories} onChange={(e) => setQuickMeal({ ...quickMeal, calories: e.target.value })} type="number" placeholder="kcal" className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-[#C8F135]" />
              <input value={quickMeal.proteinG} onChange={(e) => setQuickMeal({ ...quickMeal, proteinG: e.target.value })} type="number" placeholder="Prot. g" className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-[#C8F135]" />
              <input value={quickMeal.carbsG} onChange={(e) => setQuickMeal({ ...quickMeal, carbsG: e.target.value })} type="number" placeholder="Gluc. g" className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-[#C8F135]" />
              <input value={quickMeal.fatG} onChange={(e) => setQuickMeal({ ...quickMeal, fatG: e.target.value })} type="number" placeholder="Lip. g" className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-[#C8F135]" />
              <button type="button" onClick={addQuickMeal} disabled={!quickMeal.name || !quickMeal.calories} aria-label="Enregistrer le repas rapide" className="rounded-xl bg-[#C8F135] px-4 py-2 text-sm font-bold text-zinc-900 transition-colors hover:bg-[#d4f54d] disabled:opacity-50">Ajouter</button>
            </div>
          </div>
        )}

        {todayMeals.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-8">Aucun repas planifié pour ce jour.</p>
        ) : (
          todayMeals.map((meal) => <MealCard key={meal.id} meal={meal} />)
        )}
      </div>

      {/* Calculateur rapide aliment → macros */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="size-4 text-[#C8F135]" />
            <h3 className="text-sm font-semibold text-white">Ajouter un aliment calculé</h3>
          </div>
          <span className="text-xs text-zinc-500">Calcule les macros puis ajoute l’aliment au jour sélectionné.</span>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs text-zinc-500 mb-1.5">Aliment</label>
            <select
              value={calcFoodId}
              onChange={e => setCalcFoodId(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white outline-none focus:border-[#C8F135]"
            >
              <option value="">-- Choisir un aliment --</option>
              {['protein','carb','fat','vegetable','fruit','dairy'].map(cat => (
                <optgroup key={cat} label={
                  cat === 'protein' ? 'Protéines' : cat === 'carb' ? 'Glucides' :
                  cat === 'fat' ? 'Lipides' : cat === 'vegetable' ? 'Légumes' :
                  cat === 'fruit' ? 'Fruits' : 'Produits laitiers'
                }>
                  {FOOD_DATABASE.filter(f => f.category === cat).map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="w-28">
            <label className="block text-xs text-zinc-500 mb-1.5">Quantité (g)</label>
            <input
              type="number"
              value={calcGrams}
              min={1}
              max={2000}
              onChange={e => setCalcGrams(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white outline-none focus:border-[#C8F135] tabular-nums"
            />
          </div>
        </div>

        {/* Résultat instantané */}
        {calcResult && (
          <div className="mt-4 grid grid-cols-4 gap-3">
            {[
              { label: 'Calories', value: calcResult.calories, unit: 'kcal', color: 'text-white' },
              { label: 'Protéines', value: calcResult.proteinG, unit: 'g', color: 'text-[#C8F135]' },
              { label: 'Glucides',  value: calcResult.carbsG,  unit: 'g', color: 'text-sky-400' },
              { label: 'Lipides',   value: calcResult.fatG,    unit: 'g', color: 'text-pink-400' },
            ].map(m => (
              <div key={m.label} className="rounded-xl bg-zinc-800 border border-zinc-700 p-3 text-center">
                <p className={`text-lg font-bold tabular-nums ${m.color}`}>{m.value}{m.unit}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
        )}
        {calcResult && (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-600">
              Pour {calcGrams}g de {calcResult.name} · Fibres : {calcResult.fiberG}g
            </p>
            <button
              type="button"
              onClick={addCalculatedFood}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C8F135] px-4 py-2 text-sm font-bold text-zinc-900 transition-colors hover:bg-[#d4f54d]"
            >
              <Plus className="size-4" />
              Ajouter cet aliment
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
