'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { ProfileSync } from '@/components/ProfileSync'

const FULLSCREEN_ROUTES = ['/choose', '/coaching/status', '/coaches']
const FULLSCREEN_PREFIXES = ['/coaches/']

/** Root member app layout: renders fullscreen for certain routes (choose, coaches, coaching/status) or the standard sidebar+bottom-nav shell otherwise. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const fullscreen = FULLSCREEN_ROUTES.includes(pathname) || FULLSCREEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (fullscreen) {
    return (
      <div className="min-h-screen bg-black text-white">
        <ProfileSync />
        {children}
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-zinc-900 text-white overflow-hidden">
      <ProfileSync />
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
