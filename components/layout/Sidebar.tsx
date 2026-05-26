'use client'
// Sidebar fixe desktop — navigation principale + logos intégrations connectées
// deps: npm install lucide-react

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Dumbbell, UtensilsCrossed, TrendingUp,
  Download, Settings, ShoppingBag, Plug, X, ChevronLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'
const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/training',   label: 'Entraînement', icon: Dumbbell },
  { href: '/nutrition',  label: 'Nutrition',    icon: UtensilsCrossed },
  { href: '/progress',   label: 'Progression',  icon: TrendingUp },
  { href: '/exports',      label: 'Exports',       icon: Download },
  { href: '/shop',         label: 'Boutique',      icon: ShoppingBag },
  { href: '/integrations', label: 'Intégrations',  icon: Plug },
  { href: '/settings',     label: 'Paramètres',    icon: Settings },
]

export function Sidebar() {
  const pathname       = usePathname()
  const { sidebarOpen, toggleSidebar } = useUIStore()

  return (
    <>
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 z-30 flex h-full w-64 flex-col bg-zinc-950 border-r border-zinc-800 lg:translate-x-0 lg:static lg:z-auto"
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-[#C8F135] flex items-center justify-center">
              <Dumbbell className="size-4 text-zinc-900" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">FitCoach</span>
            <span className="text-[#C8F135] font-bold">AI</span>
          </Link>
          <button onClick={toggleSidebar} className="text-zinc-400 hover:text-white lg:hidden">
            <X className="size-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-[#C8F135]/10 text-[#C8F135]'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800',
                )}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-600 text-center">FitCoach AI · v1.0</p>
        </div>
      </motion.aside>
    </>
  )
}
