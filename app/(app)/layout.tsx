// Layout racine des routes protégées — sidebar + bottom nav + header
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/auth/signin')

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
