// Onboarding page: standalone layout without the authenticated app shell.
import type { Metadata } from 'next'
import { OnboardingStepper } from '@/components/onboarding/OnboardingStepper'
import { Dumbbell } from 'lucide-react'

export const metadata: Metadata = { title: 'Onboarding — fitcoach' }

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <header className="flex items-center gap-2 px-6 py-5">
        <div className="size-8 rounded-lg bg-[#C8F135] flex items-center justify-center">
          <Dumbbell className="size-4 text-zinc-900" />
        </div>
        <span className="font-bold text-white text-lg">fitcoach</span>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-8 overflow-y-auto">
        <OnboardingStepper />
      </main>
    </div>
  )
}
