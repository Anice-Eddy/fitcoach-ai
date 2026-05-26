// Page Training — programme + séance du jour
import type { Metadata } from 'next'
import { Header }      from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { TrainingClient } from './TrainingClient'

export const metadata: Metadata = { title: 'Entraînement — fitcoach' }

export default function TrainingPage() {
  return (
    <>
      <Header title="Entraînement" />
      <PageWrapper>
        <TrainingClient />
      </PageWrapper>
    </>
  )
}
