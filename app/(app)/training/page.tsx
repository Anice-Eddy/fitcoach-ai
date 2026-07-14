// Training page: program + today's session.
import type { Metadata } from 'next'
import { Header }      from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { getServerTranslations } from '@/lib/i18n/server'
import { TrainingClient } from './TrainingClient'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations()

  return { title: `${t('training.title')} — BodyOps` }
}

/** Server component shell for the training page; renders the interactive TrainingClient. */
export default function TrainingPage() {
  return (
    <>
      <Header titleKey="training.title" />
      <PageWrapper>
        <TrainingClient />
      </PageWrapper>
    </>
  )
}
