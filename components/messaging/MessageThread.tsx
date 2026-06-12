import { ArrowDown, ArrowUp, MessageSquare } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { MessageBubble, type MessageBubbleData } from './MessageBubble'

type MessageThreadProps<T extends MessageBubbleData> = {
  loading: boolean
  emptyLabel: string
  noSelectionLabel: string
  hasSelection: boolean
  messages: T[]
  isMine: (message: T) => boolean
  labelFor: (message: T, mine: boolean) => string
}

/** Shared message thread with loading, empty state and auto-scroll to the latest message. */
export function MessageThread<T extends MessageBubbleData>({
  loading,
  emptyLabel,
  noSelectionLabel,
  hasSelection,
  messages,
  isMine,
  labelFor,
}: MessageThreadProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const scrollToTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <p className="text-center text-xs text-zinc-500">Chargement…</p>
      </div>
    )
  }

  if (!hasSelection || messages.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6 text-center">
        <MessageSquare className="mx-auto mb-3 size-9 text-zinc-700" />
        <p className="text-sm text-zinc-500">{hasSelection ? emptyLabel : noSelectionLabel}</p>
      </div>
    )
  }

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <div
        ref={scrollRef}
        className="h-full min-h-0 space-y-3 overflow-y-auto scroll-smooth p-4 pb-20 pr-4 sm:pr-14"
      >
        {messages.map(message => {
          const mine = isMine(message)
          return (
            <MessageBubble
              key={message.id}
              message={message}
              mine={mine}
              label={labelFor(message, mine)}
              showReadStatus={mine}
            />
          )
        })}
        <div ref={endRef} />
      </div>

      <div className="pointer-events-none absolute bottom-4 right-3 flex flex-col gap-2 sm:right-4">
        <button
          type="button"
          onClick={scrollToTop}
          className="pointer-events-auto rounded-full border border-zinc-700 bg-zinc-950/90 p-2 text-zinc-300 shadow-lg shadow-black/20 backdrop-blur transition-colors hover:border-[#C8F135]/60 hover:text-[#C8F135]"
          aria-label="Remonter au début de la conversation"
          title="Remonter"
        >
          <ArrowUp className="size-4" />
        </button>
        <button
          type="button"
          onClick={scrollToBottom}
          className="pointer-events-auto rounded-full border border-zinc-700 bg-zinc-950/90 p-2 text-zinc-300 shadow-lg shadow-black/20 backdrop-blur transition-colors hover:border-[#C8F135]/60 hover:text-[#C8F135]"
          aria-label="Descendre au dernier message"
          title="Descendre"
        >
          <ArrowDown className="size-4" />
        </button>
      </div>
    </div>
  )
}
