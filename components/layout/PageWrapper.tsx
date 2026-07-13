// Page wrapper with consistent padding and mobile bottom-nav spacing.

import { cn } from '@/lib/utils'

interface PageWrapperProps {
  children:  React.ReactNode
  className?: string
  noPadding?: boolean
}

/** Scrollable page container with consistent padding and extra bottom spacing to avoid overlap with the mobile bottom nav. */
export function PageWrapper({ children, className, noPadding }: PageWrapperProps) {
  return (
    <main
      className={cn(
        'flex-1 overflow-y-auto',
        !noPadding && 'p-4 lg:p-6',
        'pb-24 lg:pb-6', // Space for the mobile bottom nav.
        className,
      )}
    >
      {children}
    </main>
  )
}
