// Dashboard route: main member overview page.
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DashboardClient } from './DashboardClient'
import { PageSkeleton } from '@/components/ui/LoadingSkeleton'

export const metadata: Metadata = { title: 'Tableau de bord — BodyOps' }

/** Server component wrapping the member dashboard with a Suspense skeleton fallback. */
export default function DashboardPage() {
  return (
    <>
      <Header title="Tableau de bord" />
      <PageWrapper>
        <Suspense fallback={<PageSkeleton />}>
          <DashboardClient />
        </Suspense>
      </PageWrapper>
    </>
  )
}
