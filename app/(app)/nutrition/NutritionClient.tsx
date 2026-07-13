'use client'
// Nutrition client page: generates and displays the weekly plan.

import { useEffect, useState, useMemo } from 'react'
import { useUserStore }        from '@/stores/userStore'
import { useNutritionStore }   from '@/stores/nutritionStore'
import { generateMealPlan }    from '@/lib/nutrition/generate-meal-plan'
import { getMealsForDay, sumMacros } from '@/lib/nutrition/macro-calculator'
import { MealCard }            from '@/components/nutrition/MealCard'
import { MacroRing }           from '@/components/ui/MacroRing'
import { ProgressBar }         from '@/components/ui/ProgressBar'
import { ListSkeleton }        from '@/components/ui/LoadingSkeleton'
import { FOOD_DATABASE, calculateFoodMacros, foodDisplayName } from '@/lib/nutrition/food-database'
import type { NutritionPlan } from '@/types'
import Link from 'next/link'
import { Plus, ShoppingCart, Calculator, Trash2 } from 'lucide-react'
import { useLocale } from '@/contexts/LocaleContext'

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const FOOD_CATEGORIES = ['protein', 'carb', 'fat', 'vegetable', 'fruit', 'dairy'] as const

type ActiveNutritionTarget = {
  targetCalories: number
  targetProteinG: number
  targetCarbsG: number
  targetFatG: number
}

type SharedFood = {
  id: string
  name: string
  nameFr: string | null
  nameEn: string | null
  displayName: string
  brand: string | null
  category: typeof FOOD_CATEGORIES[number]
  visibility: 'PUBLIC' | 'PRIVATE'
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  fiberPer100g: number | null
  sugarPer100g: number | null
  canDelete: boolean
}

type FoodOption = {
  key: string
  id: string
  source: 'BODYOPS' | 'USER'
  name: string
  displayName: string
  brand?: string | null
  category: typeof FOOD_CATEGORIES[number]
  canDelete: boolean
  macrosPer100g: { calories: number; proteinG: number; carbsG: number; fatG: number; fiberG: number }
}

/** Interactive nutrition plan view: fetches or generates a weekly meal plan and allows day/meal navigation with macro summaries. */
export function NutritionClient() {
  const { locale, t } = useLocale()
  const { profile }  = useUserStore()
  const { ensureTodayLog, logMeal, setTodayMeals } = useNutritionStore()
  const [plan, setPlan]       = useState<NutritionPlan | null>(null)
  const [coachTarget, setCoachTarget] = useState<ActiveNutritionTarget | null>(null)
  const [loading, setLoading] = useState(true)
  const [addingMeal, setAddingMeal] = useState(false)
  const [quickMeal, setQuickMeal] = useState({ name: '', calories: '', proteinG: '', carbsG: '', fatG: '' })
  const [sharedFoods, setSharedFoods] = useState<SharedFood[]>([])
  const [creatingFood, setCreatingFood] = useState(false)
  const [foodForm, setFoodForm] = useState({
    nameFr: '', nameEn: '', brand: '', category: 'protein', caloriesPer100g: '', proteinPer100g: '',
    carbsPer100g: '', fatPer100g: '', fiberPer100g: '', visibility: 'PUBLIC',
  })
  const [selectedDay, setDay] = useState(0)
  // Quick calculator: food + quantity -> instant macros.
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
    fetch(`/api/user/nutrition/foods?locale=${locale}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data?.foods)) setSharedFoods(data.foods)
      })
      .catch(() => {})
    const d = new Date().getDay()
    const todayIndex = d === 0 ? 6 : d - 1
    setDay(todayIndex)
  }, [ensureTodayLog, locale, setTodayMeals])

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
      locale,
    })
    setPlan(generated)
    setLoading(false)
  }, [profile, coachTarget, locale])

  const foodOptions = useMemo<FoodOption[]>(() => [
    ...FOOD_DATABASE.map(food => ({
      key:          `bodyops:${food.id}`,
      id:           food.id,
      source:       'BODYOPS' as const,
      name:         food.name,
      displayName:  foodDisplayName(food, locale),
      brand:        food.brand,
      category:     food.category,
      canDelete:    false,
      macrosPer100g: {
        calories: food.calories,
        proteinG: food.proteinG,
        carbsG:   food.carbsG,
        fatG:     food.fatG,
        fiberG:   food.fiberG,
      },
    })),
    ...sharedFoods.map(food => ({
      key:          `library:${food.id}`,
      id:           food.id,
      source:       'USER' as const,
      name:         food.name,
      displayName:  food.displayName || (locale === 'en' ? food.nameEn : food.nameFr) || food.name,
      brand:        food.brand,
      category:     food.category,
      canDelete:    food.canDelete,
      macrosPer100g: {
        calories: food.caloriesPer100g,
        proteinG: food.proteinPer100g,
        carbsG:   food.carbsPer100g,
        fatG:     food.fatPer100g,
        fiberG:   food.fiberPer100g ?? 0,
      },
    })),
  ], [locale, sharedFoods])

  const selectedFood = useMemo(() => foodOptions.find(food => food.key === calcFoodId) ?? null, [calcFoodId, foodOptions])

  // Real-time macro calculation for the quick calculator with BodyOps or shared foods.
  const calcResult = useMemo(() => {
    if (!selectedFood || !calcGrams) return null
    if (selectedFood.source === 'BODYOPS') {
      const result = calculateFoodMacros(selectedFood.id, parseFloat(calcGrams) || 0)
      return result ? { ...result, name: selectedFood.displayName } : null
    }

    const grams = parseFloat(calcGrams) || 0
    const factor = grams / 100
    return {
      name:     selectedFood.displayName,
      grams,
      calories: Math.round(selectedFood.macrosPer100g.calories * factor),
      proteinG: Math.round(selectedFood.macrosPer100g.proteinG * factor * 10) / 10,
      carbsG:   Math.round(selectedFood.macrosPer100g.carbsG * factor * 10) / 10,
      fatG:     Math.round(selectedFood.macrosPer100g.fatG * factor * 10) / 10,
      fiberG:   Math.round(selectedFood.macrosPer100g.fiberG * factor * 10) / 10,
    }
  }, [selectedFood, calcGrams])

  if (loading) return <ListSkeleton rows={5} />

  const todayMeals = plan ? getMealsForDay(plan.meals, selectedDay) : []
  const todayTotals = sumMacros(todayMeals)
  const availableDays = 7

  // Adds a meal to the displayed plan and logs it if the selected day is today.
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
    if (!plan || !calcResult || !selectedFood) return
    const id = `food-${selectedFood.id}-${Date.now()}`
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
        id: selectedFood.id,
        name: calcResult.name,
        brand: selectedFood.brand ?? undefined,
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

  const createSharedFood = async () => {
    const nameFr = foodForm.nameFr.trim()
    const nameEn = foodForm.nameEn.trim()
    const fallbackName = locale === 'en' ? (nameEn || nameFr) : (nameFr || nameEn)
    const payload = {
      name:            fallbackName,
      nameFr:          nameFr || null,
      nameEn:          nameEn || null,
      brand:           foodForm.brand.trim() || null,
      category:        foodForm.category,
      visibility:      foodForm.visibility,
      caloriesPer100g: Number(foodForm.caloriesPer100g || 0),
      proteinPer100g:  Number(foodForm.proteinPer100g || 0),
      carbsPer100g:    Number(foodForm.carbsPer100g || 0),
      fatPer100g:      Number(foodForm.fatPer100g || 0),
      fiberPer100g:    foodForm.fiberPer100g ? Number(foodForm.fiberPer100g) : null,
    }
    const res = await fetch(`/api/user/nutrition/foods?locale=${locale}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.food) return
    setSharedFoods(prev => [...prev, data.food])
    setCalcFoodId(`library:${data.food.id}`)
    setFoodForm({
      nameFr: '', nameEn: '', brand: '', category: 'protein', caloriesPer100g: '', proteinPer100g: '',
      carbsPer100g: '', fatPer100g: '', fiberPer100g: '', visibility: 'PUBLIC',
    })
    setCreatingFood(false)
  }

  const deleteSelectedSharedFood = async () => {
    if (!selectedFood?.canDelete || selectedFood.source !== 'USER') return
    const res = await fetch(`/api/user/nutrition/foods/${selectedFood.id}`, { method: 'DELETE' })
    if (!res.ok) return
    setSharedFoods(prev => prev.filter(food => food.id !== selectedFood.id))
    setCalcFoodId('')
  }

  return (
    <div className="space-y-6">
      {/* Daily macro summary */}
      {plan && (
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">{t('nutrition.daySummary')}</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {t('nutrition.objective')} : {Math.round(plan.targetCalories)} kcal{coachTarget ? ` · ${t('nutrition.definedByCoach')}` : ''}
              </p>
            </div>
            <Link href="/nutrition/shopping-list"
              className="flex items-center gap-1.5 text-xs text-[#C8F135] hover:underline"
              aria-label={t('nutrition.shoppingListAria')}
            >
              <ShoppingCart className="size-3.5" /> {t('nutrition.shoppingList')}
            </Link>
          </div>
          <MacroRing
            proteinG={Math.round(todayTotals.proteinG)}
            carbsG={Math.round(todayTotals.carbsG)}
            fatG={Math.round(todayTotals.fatG)}
            targetCalories={Math.round(plan.targetCalories)}
          />
          <div className="space-y-2 mt-4">
            <ProgressBar value={todayTotals.proteinG} max={plan.targetProteinG} label={t('nutrition.protein')} sublabel={`${Math.round(todayTotals.proteinG)}/${Math.round(plan.targetProteinG)}g`} color="#C8F135" size="sm" />
            <ProgressBar value={todayTotals.carbsG}   max={plan.targetCarbsG}   label={t('nutrition.carbs')}  sublabel={`${Math.round(todayTotals.carbsG)}/${Math.round(plan.targetCarbsG)}g`}   color="#38bdf8" size="sm" />
            <ProgressBar value={todayTotals.fatG}     max={plan.targetFatG}     label={t('nutrition.fat')}   sublabel={`${Math.round(todayTotals.fatG)}/${Math.round(plan.targetFatG)}g`}     color="#f472b6" size="sm" />
          </div>
        </div>
      )}

      {/* Day selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {DAYS.slice(0, availableDays).map((day, i) => (
          <button key={i} onClick={() => setDay(i)}
            className={`flex-1 min-w-[44px] py-2 rounded-xl text-xs font-medium transition-colors ${
              selectedDay === i ? 'bg-[#C8F135] text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >{t(`nutrition.days.${day}`)}</button>
        ))}
      </div>

      {/* Repas du jour */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setAddingMeal((value) => !value)}
          aria-label={t('nutrition.addMeal')}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
        >
          <Plus className="size-4" /> {t('nutrition.addMeal')}
        </button>

        {addingMeal && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="grid gap-3 sm:grid-cols-7">
              <input value={quickMeal.name} onChange={(e) => setQuickMeal({ ...quickMeal, name: e.target.value })} placeholder={t('nutrition.mealNamePlaceholder')} className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-[#C8F135] sm:col-span-2" />
              <input value={quickMeal.calories} onChange={(e) => setQuickMeal({ ...quickMeal, calories: e.target.value })} type="number" placeholder="kcal" className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-[#C8F135]" />
              <input value={quickMeal.proteinG} onChange={(e) => setQuickMeal({ ...quickMeal, proteinG: e.target.value })} type="number" placeholder={t('nutrition.proteinShortPlaceholder')} className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-[#C8F135]" />
              <input value={quickMeal.carbsG} onChange={(e) => setQuickMeal({ ...quickMeal, carbsG: e.target.value })} type="number" placeholder={t('nutrition.carbsShortPlaceholder')} className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-[#C8F135]" />
              <input value={quickMeal.fatG} onChange={(e) => setQuickMeal({ ...quickMeal, fatG: e.target.value })} type="number" placeholder={t('nutrition.fatShortPlaceholder')} className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-[#C8F135]" />
              <button type="button" onClick={addQuickMeal} disabled={!quickMeal.name || !quickMeal.calories} aria-label={t('nutrition.saveQuickMealAria')} className="rounded-xl bg-[#C8F135] px-4 py-2 text-sm font-bold text-zinc-900 transition-colors hover:bg-[#d4f54d] disabled:opacity-50">{t('common.add')}</button>
            </div>
          </div>
        )}

        {todayMeals.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-8">{t('nutrition.noMealPlanned')}</p>
        ) : (
          todayMeals.map((meal) => <MealCard key={meal.id} meal={meal} />)
        )}
      </div>

      {/* Quick food-to-macro calculator */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="size-4 text-[#C8F135]" />
            <h3 className="text-sm font-semibold text-white">{t('nutrition.calculatedFoodTitle')}</h3>
          </div>
          <span className="text-xs text-zinc-500">{t('nutrition.calculatedFoodDescription')}</span>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs text-zinc-500 mb-1.5">{t('nutrition.food')}</label>
            <select
              value={calcFoodId}
              onChange={e => setCalcFoodId(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white outline-none focus:border-[#C8F135]"
            >
              <option value="">{t('nutrition.chooseFood')}</option>
              {FOOD_CATEGORIES.map(cat => (
                <optgroup key={cat} label={t(`nutrition.categories.${cat}`)}>
                  {foodOptions.filter(f => f.category === cat).map(f => (
                    <option key={f.key} value={f.key}>
                      {f.displayName}{f.source === 'USER' ? ` · ${t('nutrition.sharedSuffix')}` : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="w-28">
            <label className="block text-xs text-zinc-500 mb-1.5">{t('nutrition.quantityG')}</label>
            <input
              type="number"
              value={calcGrams}
              min={1}
              max={2000}
              onChange={e => setCalcGrams(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white outline-none focus:border-[#C8F135] tabular-nums"
            />
          </div>
          <div className="flex min-w-[180px] items-end gap-2">
            <button
              type="button"
              onClick={() => setCreatingFood(value => !value)}
              className="flex-1 rounded-xl border border-[#C8F135]/40 bg-[#C8F135]/10 px-3 py-2.5 text-sm font-semibold text-[#C8F135] transition-colors hover:bg-[#C8F135]/15"
            >
              {t('nutrition.createFood')}
            </button>
            {selectedFood?.canDelete && (
              <button
                type="button"
                onClick={deleteSelectedSharedFood}
                aria-label={t('nutrition.deleteFoodAria')}
                className="rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-red-300 transition-colors hover:bg-red-500/15"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        </div>

        {creatingFood && (
          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-white">{t('nutrition.newSharedFood')}</h4>
              <p className="text-xs text-zinc-500">{t('nutrition.newSharedFoodDescription')}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-6">
              <input value={foodForm.nameFr} onChange={e => setFoodForm({ ...foodForm, nameFr: e.target.value })} placeholder={t('nutrition.foodNameFrPlaceholder')} className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-[#C8F135]" />
              <input value={foodForm.nameEn} onChange={e => setFoodForm({ ...foodForm, nameEn: e.target.value })} placeholder={t('nutrition.foodNameEnPlaceholder')} className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-[#C8F135]" />
              <input value={foodForm.brand} onChange={e => setFoodForm({ ...foodForm, brand: e.target.value })} placeholder={t('nutrition.brandOptional')} className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-[#C8F135]" />
              <select value={foodForm.category} onChange={e => setFoodForm({ ...foodForm, category: e.target.value })} className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-[#C8F135]">
                {FOOD_CATEGORIES.map(category => <option key={category} value={category}>{t(`nutrition.categories.${category}`)}</option>)}
              </select>
              <select value={foodForm.visibility} onChange={e => setFoodForm({ ...foodForm, visibility: e.target.value })} className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-[#C8F135]">
                <option value="PUBLIC">{t('nutrition.visibleEveryone')}</option>
                <option value="PRIVATE">{t('nutrition.private')}</option>
              </select>
              <input value={foodForm.caloriesPer100g} onChange={e => setFoodForm({ ...foodForm, caloriesPer100g: e.target.value })} type="number" min={0} placeholder={t('nutrition.caloriesPer100g')} className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-[#C8F135]" />
              <input value={foodForm.proteinPer100g} onChange={e => setFoodForm({ ...foodForm, proteinPer100g: e.target.value })} type="number" min={0} placeholder={t('nutrition.proteinPer100g')} className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-[#C8F135]" />
              <input value={foodForm.carbsPer100g} onChange={e => setFoodForm({ ...foodForm, carbsPer100g: e.target.value })} type="number" min={0} placeholder={t('nutrition.carbsPer100g')} className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-[#C8F135]" />
              <input value={foodForm.fatPer100g} onChange={e => setFoodForm({ ...foodForm, fatPer100g: e.target.value })} type="number" min={0} placeholder={t('nutrition.fatPer100g')} className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-[#C8F135]" />
              <input value={foodForm.fiberPer100g} onChange={e => setFoodForm({ ...foodForm, fiberPer100g: e.target.value })} type="number" min={0} placeholder={t('nutrition.fiberPer100g')} className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-[#C8F135]" />
              <button type="button" onClick={createSharedFood} disabled={(!foodForm.nameFr && !foodForm.nameEn) || !foodForm.caloriesPer100g} className="rounded-xl bg-[#C8F135] px-4 py-2 text-sm font-bold text-zinc-900 transition-colors hover:bg-[#d4f54d] disabled:opacity-50">
                {t('common.save')}
              </button>
            </div>
          </div>
        )}

        {/* Instant result */}
        {calcResult && (
          <div className="mt-4 grid grid-cols-4 gap-3">
            {[
              { label: t('nutrition.calories'), value: calcResult.calories, unit: 'kcal', color: 'text-white' },
              { label: t('nutrition.protein'), value: calcResult.proteinG, unit: 'g', color: 'text-[#C8F135]' },
              { label: t('nutrition.carbs'),  value: calcResult.carbsG,  unit: 'g', color: 'text-sky-400' },
              { label: t('nutrition.fat'),   value: calcResult.fatG,    unit: 'g', color: 'text-pink-400' },
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
              {t('nutrition.for')} {calcGrams}g {t('nutrition.of')} {selectedFood?.displayName ?? calcResult.name} · {t('nutrition.fiber')} : {calcResult.fiberG}g
            </p>
            <button
              type="button"
              onClick={addCalculatedFood}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C8F135] px-4 py-2 text-sm font-bold text-zinc-900 transition-colors hover:bg-[#d4f54d]"
            >
              <Plus className="size-4" />
              {t('nutrition.addThisFood')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
