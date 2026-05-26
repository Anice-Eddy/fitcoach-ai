import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, FileText, BarChart2, Calendar, MessageSquare } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NotificationBell } from '@/components/coach/NotificationBell'

const NAV = [
  { href: '/coach/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/coach/members',   label: 'Membres',         icon: Users },
  { href: '/coach/appointments', label: 'Agenda',       icon: Calendar },
  { href: '/coach/notes',     label: 'Notes',           icon: MessageSquare },
  { href: '/coach/programs',  label: 'Programmes',      icon: FileText },
  { href: '/coach/reports',   label: 'Rapports',        icon: BarChart2 },
]

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin?callbackUrl=/coach/dashboard')

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { name: true, coachProfile: { select: { id: true } } },
  })
  if (!user?.coachProfile) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <header className="border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-6 py-3">
        <span className="text-sm text-zinc-400">
          Connecté en tant que <span className="text-white font-medium">{user.name ?? session.user.email}</span>
        </span>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            Espace membre
          </Link>
          <NotificationBell />
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-60 shrink-0 border-r border-zinc-800 flex flex-col p-4 gap-2">
          <div className="mb-6">
            <Logo href="/coach/dashboard" size="md" />
          </div>

          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <Icon className="size-4" /> {label}
            </Link>
          ))}
        </aside>

        <main className="flex-1 p-6 text-white">{children}</main>
      </div>
    </div>
  )
}
