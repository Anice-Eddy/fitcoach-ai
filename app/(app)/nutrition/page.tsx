// Page Nutrition — plan alimentaire hebdomadaire
import type { Metadata } from 'next'
import { Header }        from '@/components/layout/Header'
import { PageWrapper }   from '@/components/layout/PageWrapper'
import { NutritionClient } from './NutritionClient'

export const metadata: Metadata = { title: 'Nutrition — fitcoach' }

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
