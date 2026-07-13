// Onboarding page: standalone layout without the authenticated app shell.
import type { Metadata } from 'next'
import { OnboardingStepper } from '@/components/onboarding/OnboardingStepper'
import { Logo } from '@/components/ui/Logo'
import { PageBackground } from '@/components/landing/PageBackground'
import { getServerTranslations } from '@/lib/i18n/server'

export function generateMetadata(): Metadata {
  const { t } = getServerTranslations()

  return { title: `${t('onboarding.title')} — BodyOps` }
}

export default function OnboardingPage() {
  return (
    <div className="relative min-h-screen text-white flex flex-col">
      <PageBackground showArtwork={false} />
      <header className="relative z-10 flex items-center px-6 py-5">
        <Logo href="/" size="md" />
      </header>
      <main className="relative z-10 flex-1 flex items-start justify-center px-4 py-8 overflow-y-auto">
        <OnboardingStepper />
      </main>
    </div>
  )
}
