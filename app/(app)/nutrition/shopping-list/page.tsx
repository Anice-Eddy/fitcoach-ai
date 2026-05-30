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

/** Shopping list page: aggregates ingredients from the active weekly meal plan, groups by category. */
export default function ShoppingListPage() {
  const { profile } = useUserStore()
  const [grouped, setGrouped] = useState<GroupedShoppingList>({
    'Protéines': [], 'Glucides': [], 'Lipides': [],
    'Légumes': [], 'Fruits': [], 'Produits laitiers': [], 'Autres': [],
  })

  useEffect(() => {
    if (!profile) return
    const plan = generateMealPlan({
      targetCalories:      profile.recommendedCalories ?? 2000,
      targetProteinG:      profile.recommendedProteinG ?? 150,
      targetCarbsG:        profile.recommendedCarbsG   ?? 200,
      targetFatG:          profile.recommendedFatG     ?? 65,
      fitnessGoal:         profile.fitnessGoal,
      dietaryRestrictions: profile.dietaryRestrictions,
    })
    setGrouped(groupShoppingList(generateShoppingList(plan.meals)))
  }, [profile])

  return (
    <>
      <Header title="Liste de courses" />
      <PageWrapper>
        <ShoppingList grouped={grouped} />
      </PageWrapper>
    </>
  )
}
