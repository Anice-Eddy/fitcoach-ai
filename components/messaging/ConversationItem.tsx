import { cn } from '@/lib/utils'
import { UnreadBadge } from './UnreadBadge'

export type ConversationItemData = {
  id: string
  title: string
  subtitle: string
  initials: string
  unreadCount: number
}

type ConversationItemProps = {
  item: ConversationItemData
  active: boolean
  onSelect: () => void
}

/** One selectable row in a member/coach conversation list. */
export function ConversationItem({ item, active, onSelect }: ConversationItemProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'mb-1 flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
        active ? 'border-[#C8F135]/30 bg-[#C8F135]/10' : 'border-transparent hover:bg-zinc-900',
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">
        {item.initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{item.title}</p>
        <p className="truncate text-[11px] text-zinc-500">{item.subtitle}</p>
      </div>
      <UnreadBadge count={item.unreadCount} />
    </button>
  )
}
