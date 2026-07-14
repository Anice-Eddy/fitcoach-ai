import type { Metadata } from 'next'
import { getServerTranslations } from '@/lib/i18n/server'
import { PrivacyContent } from './PrivacyContent'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations()

  return {
    title: `${t('privacy.title')} — BodyOps`,
    description: t('privacy.metaDescription'),
  }
}

export default function PrivacyPage() {
  return <PrivacyContent />
}
