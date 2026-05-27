// App shell layout. Route protection is handled in middleware.
import { AppShell } from '@/components/layout/AppShell'

/** Member app layout: wraps all authenticated member pages inside the AppShell (sidebar + header). */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
