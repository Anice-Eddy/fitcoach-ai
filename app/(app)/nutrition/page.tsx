// Page Nutrition — plan alimentaire hebdomadaire
import type { Metadata } from 'next'
import { Header }        from '@/components/layout/Header'
import { PageWrapper }   from '@/components/layout/PageWrapper'
import { NutritionClient } from './NutritionClient'

export const metadata: Metadata = { title: 'Nutrition — BodyOps' }

/** Server component shell for the nutrition page; renders the interactive NutritionClient. */
export default function NutritionPage() {
  return (
    <>
      <Header title="Nutrition" />
      <PageWrapper>
        <NutritionClient />
      </PageWrapper>
    </>
  )
}
