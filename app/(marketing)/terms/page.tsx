import type { Metadata } from 'next'
import { getServerTranslations } from '@/lib/i18n/server'
import { TermsContent } from './TermsContent'

export function generateMetadata(): Metadata {
  const { t } = getServerTranslations()

  return {
    title: `${t('terms.title')} — BodyOps`,
    description: t('terms.metaDescription'),
  }
}

export default function TermsPage() {
  return <TermsContent />
}
