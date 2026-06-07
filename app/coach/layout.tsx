import { redirect } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NotificationBell } from '@/components/coach/NotificationBell'
import { CoachDropdown } from '@/components/coach/CoachDropdown'
import { isCoachProfileComplete } from '@/lib/coach/verification'
import { CoachSidebarNav } from '@/components/coach/CoachSidebarNav'

/** Coach layout: verifies auth, ensures coachProfile exists (redirects to completion if not), then renders the coach shell with sidebar and header. */
export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin?callbackUrl=/coach/dashboard')

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: {
      name: true,
      profile: { select: { id: true } },
      coachProfile: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          birthDate: true,
          bio: true,
          specialties: true,
          certifications: true,
          yearsExperience: true,
          documentFileName: true,
        },
      },
    },
  })
  if (!user?.coachProfile) redirect('/dashboard')
  if (!isCoachProfileComplete(user.coachProfile)) redirect('/auth/coach/complete')

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <header className="h-16 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-6">
        <span className="text-xs text-zinc-500 font-medium uppercase tracking-widest">
          Espace Coach
        </span>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <CoachDropdown />
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-60 shrink-0 border-r border-zinc-800 flex flex-col p-4 gap-2">
          <div className="mb-6">
            <Logo href="/coach/dashboard" size="md" />
          </div>

          <CoachSidebarNav />
        </aside>

        <main className="flex-1 p-6 text-white">{children}</main>
      </div>
    </div>
  )
}
