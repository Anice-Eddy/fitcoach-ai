import { User } from 'lucide-react'
import { ConversationItem, type ConversationItemData } from './ConversationItem'

export type { ConversationItemData }

type ConversationListProps = {
  title: string
  description: string
  loading: boolean
  emptyLabel: string
  items: ConversationItemData[]
  activeId: string | null
  onSelect: (id: string) => void
}

/** Shared sidebar list for coach/member messaging conversations. */
export function ConversationList({ title, description, loading, emptyLabel, items, activeId, onSelect }: ConversationListProps) {
  return (
    <aside className="border-b border-zinc-800 bg-zinc-950/60 lg:border-b-0 lg:border-r">
      <div className="border-b border-zinc-800 p-4">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
      </div>
      <div className="max-h-80 overflow-y-auto p-2 lg:max-h-none">
        {loading ? (
          <p className="p-4 text-xs text-zinc-500">Chargement…</p>
        ) : items.length === 0 ? (
          <div className="p-6 text-center">
            <User className="mx-auto mb-2 size-8 text-zinc-700" />
            <p className="text-xs text-zinc-500">{emptyLabel}</p>
          </div>
        ) : items.map(item => (
          <ConversationItem
            key={item.id}
            item={item}
            active={activeId === item.id}
            onSelect={() => onSelect(item.id)}
          />
        ))}
      </div>
    </aside>
  )
}
