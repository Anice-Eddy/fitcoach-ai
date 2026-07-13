// Dashboard route: main member overview page.
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DashboardClient } from './DashboardClient'
import { PageSkeleton } from '@/components/ui/LoadingSkeleton'
import { getServerTranslations } from '@/lib/i18n/server'

export function generateMetadata(): Metadata {
  const { t } = getServerTranslations()

  return { title: `${t('dashboard.title')} — BodyOps` }
}

/** Server component wrapping the member dashboard with a Suspense skeleton fallback. */
export default function DashboardPage() {
  return (
    <>
      <Header titleKey="dashboard.title" />
      <PageWrapper>
        <Suspense fallback={<PageSkeleton />}>
          <DashboardClient />
        </Suspense>
      </PageWrapper>
    </>
  )
}
