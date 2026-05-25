// Layout coach — barre latérale dédiée, séparé du layout app utilisateur

import Link from 'next/link'
import { Dumbbell, LayoutDashboard, Users, FileText, BarChart2 } from 'lucide-react'

const NAV = [
  { href: '/coach/dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/coach/members',   label: 'Membres',     icon: Users },
  { href: '/coach/programs',  label: 'Programmes',  icon: FileText },
  { href: '/coach/reports',   label: 'Rapports',    icon: BarChart2 },
]

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <aside className="w-60 shrink-0 border-r border-zinc-800 flex flex-col p-4 gap-2">
        <Link href="/coach/dashboard" className="flex items-center gap-2 mb-6">
          <div className="size-8 rounded-lg bg-[#C8F135] flex items-center justify-center">
            <Dumbbell className="size-4 text-zinc-900" />
          </div>
          <span className="font-bold text-white">Coach<span className="text-[#C8F135]">Panel</span></span>
        </Link>

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
  )
}
