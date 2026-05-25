// Wrapper de page — padding cohérent + espacement bottom nav mobile

import { cn } from '@/lib/utils'

interface PageWrapperProps {
  children:  React.ReactNode
  className?: string
  noPadding?: boolean
}

export function PageWrapper({ children, className, noPadding }: PageWrapperProps) {
  return (
    <main
      className={cn(
        'flex-1 overflow-y-auto',
        !noPadding && 'p-4 lg:p-6',
        'pb-24 lg:pb-6', // espace pour la bottom nav mobile
        className,
      )}
    >
      {children}
    </main>
  )
}
