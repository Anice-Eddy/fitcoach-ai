'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'

const FULLSCREEN_ROUTES = ['/choose', '/coaching/status']
const FULLSCREEN_PREFIXES = ['/coaches/']

// Some product flows should feel like focused standalone pages.
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const fullscreen = FULLSCREEN_ROUTES.includes(pathname) || FULLSCREEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (fullscreen) {
    return <div className="min-h-screen bg-black text-white">{children}</div>
  }

  return (
    <div className="flex h-screen bg-zinc-900 text-white overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
