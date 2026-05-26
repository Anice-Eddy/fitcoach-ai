'use client'
// Page liste de courses — générée depuis le plan nutritionnel
import { useEffect, useState } from 'react'
import { Header }        from '@/components/layout/Header'
import { PageWrapper }   from '@/components/layout/PageWrapper'
import { ShoppingList }  from '@/components/nutrition/ShoppingList'
import { useUserStore }  from '@/stores/userStore'
import { generateMealPlan }    from '@/lib/nutrition/generate-meal-plan'
import { generateShoppingList } from '@/lib/nutrition/macro-calculator'

export default function ShoppingListPage() {
  const { profile }  = useUserStore()
  const [items, setItems] = useState<Record<string, { name: string; totalGrams: number; category: string }>>({})

  useEffect(() => {
    if (!profile) return
    const plan = generateMealPlan({
      targetCalories:      profile.recommendedCalories ?? 2000,
      targetProteinG:      profile.recommendedProteinG ?? 150,
      targetCarbsG:        profile.recommendedCarbsG ?? 200,
      targetFatG:          profile.recommendedFatG ?? 65,
      fitnessGoal:         profile.fitnessGoal,
      dietaryRestrictions: profile.dietaryRestrictions,
    })
    setItems(generateShoppingList(plan.meals))
  }, [profile])

  return (
    <>
      <Header title="Liste de courses" />
      <PageWrapper>
        <ShoppingList items={items} />
      </PageWrapper>
    </>
  )
}
