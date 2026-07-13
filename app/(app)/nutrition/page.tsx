// Nutrition page - weekly meal plan.
import type { Metadata } from 'next'
import { Header }        from '@/components/layout/Header'
import { PageWrapper }   from '@/components/layout/PageWrapper'
import { NutritionClient } from './NutritionClient'
import { getServerTranslations } from '@/lib/i18n/server'

export function generateMetadata(): Metadata {
  const { t } = getServerTranslations()

  return { title: `${t('nutrition.title')} — BodyOps` }
}

/** Server component shell for the nutrition page; renders the interactive NutritionClient. */
export default function NutritionPage() {
  return (
    <>
      <Header titleKey="nav.nutrition" />
      <PageWrapper>
        <NutritionClient />
      </PageWrapper>
    </>
  )
}
