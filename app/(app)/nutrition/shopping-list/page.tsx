'use client'
// Page liste de courses — générée depuis le plan nutritionnel, groupée par catégorie
import { useEffect, useState } from 'react'
import { Header }         from '@/components/layout/Header'
import { PageWrapper }    from '@/components/layout/PageWrapper'
import { ShoppingList }   from '@/components/nutrition/ShoppingList'
import { useUserStore }   from '@/stores/userStore'
import { generateMealPlan }        from '@/lib/nutrition/generate-meal-plan'
import { generateShoppingList, groupShoppingList } from '@/lib/nutrition/shopping-list'
import type { GroupedShoppingList } from '@/lib/nutrition/shopping-list'

type ActiveNutritionTarget = {
  targetCalories: number
  targetProteinG: number
  targetCarbsG: number
  targetFatG: number
}

/** Shopping list page: aggregates ingredients from the active weekly meal plan, groups by category. */
export default function ShoppingListPage() {
  const { profile } = useUserStore()
  const [coachTarget, setCoachTarget] = useState<ActiveNutritionTarget | null>(null)
  const [grouped, setGrouped] = useState<GroupedShoppingList>({
    'Protéines': [], 'Glucides': [], 'Lipides': [],
    'Légumes': [], 'Fruits': [], 'Produits laitiers': [], 'Autres': [],
  })

  useEffect(() => {
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
  }, [])

  useEffect(() => {
    if (!profile) return
    const target = coachTarget ?? {
      targetCalories: profile.recommendedCalories ?? 2000,
      targetProteinG: profile.recommendedProteinG ?? 150,
      targetCarbsG:   profile.recommendedCarbsG ?? 200,
      targetFatG:     profile.recommendedFatG ?? 65,
    }
    const plan = generateMealPlan({
      targetCalories:      target.targetCalories,
      targetProteinG:      target.targetProteinG,
      targetCarbsG:        target.targetCarbsG,
      targetFatG:          target.targetFatG,
      fitnessGoal:         profile.fitnessGoal,
      dietaryRestrictions: profile.dietaryRestrictions,
    })
    setGrouped(groupShoppingList(generateShoppingList(plan.meals)))
  }, [profile, coachTarget])

  return (
    <>
      <Header title="Liste de courses" />
      <PageWrapper>
        <ShoppingList grouped={grouped} />
      </PageWrapper>
    </>
  )
}
