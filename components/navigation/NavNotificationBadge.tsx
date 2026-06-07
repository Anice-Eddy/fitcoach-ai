import { cn } from '@/lib/utils'

type NavNotificationBadgeProps = {
  count: number
  variant?: 'inline' | 'floating'
}

/** Shared unread badge used by member and coach navigation items. */
export function NavNotificationBadge({ count, variant = 'inline' }: NavNotificationBadgeProps) {
  if (count <= 0) return null

  return (
    <span
      className={cn(
        'shrink-0 items-center justify-center rounded-full bg-[#C8F135] font-bold text-zinc-950',
        variant === 'floating'
          ? 'absolute right-2 top-2 flex size-4 text-[9px]'
          : 'flex size-5 text-[10px]',
      )}
    >
      {count > 9 ? '9+' : count}
    </span>
  )
}
