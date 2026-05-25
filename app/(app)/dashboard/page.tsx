// Page Dashboard — tableau de bord principal
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { DashboardClient } from './DashboardClient'
import { PageSkeleton } from '@/components/ui/LoadingSkeleton'

export const metadata: Metadata = { title: 'Dashboard — FitCoach AI' }

export default function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" />
      <PageWrapper>
        <Suspense fallback={<PageSkeleton />}>
          <DashboardClient />
        </Suspense>
      </PageWrapper>
    </>
  )
}
