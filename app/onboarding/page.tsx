// Onboarding page: standalone layout without the authenticated app shell.
import type { Metadata } from 'next'
import { OnboardingStepper } from '@/components/onboarding/OnboardingStepper'
import { Logo } from '@/components/ui/Logo'

export const metadata: Metadata = { title: 'Onboarding — BodyOps' }

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <header className="flex items-center px-6 py-5">
        <Logo href="/" size="md" />
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-8 overflow-y-auto">
        <OnboardingStepper />
      </main>
    </div>
  )
}
