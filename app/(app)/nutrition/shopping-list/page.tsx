'use client'
// Page liste de courses — générée depuis le plan nutritionnel
import { useEffect, useState } from 'react'
import { Header }        from '@/components/layout/Header'
import { PageWrapper }   from '@/components/layout/PageWrapper'
import { ShoppingList }  from '@/components/nutrition/ShoppingList'
import { UpgradePrompt } from '@/components/ui/UpgradePrompt'
import { useUserStore }  from '@/stores/userStore'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { generateMealPlan }    from '@/lib/nutrition/generate-meal-plan'
import { generateShoppingList } from '@/lib/nutrition/macro-calculator'

export default function ShoppingListPage() {
  const { profile }  = useUserStore()
  const { isPro }    = useSubscriptionStore()
  const [items, setItems] = useState<Record<string, { name: string; totalGrams: number; category: string }>>({})

  useEffect(() => {
    if (!profile || !isPro()) return
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
        {!isPro() ? (
          <UpgradePrompt
            feature="Liste de courses automatique"
            description="La liste de courses est générée automatiquement depuis votre plan nutritionnel 7 jours. Disponible avec le plan Pro."
          />
        ) : (
          <ShoppingList items={items} />
        )}
      </PageWrapper>
    </>
  )
}
