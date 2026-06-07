import { MessageSquare } from 'lucide-react'
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
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  if (loading) return <p className="py-10 text-center text-xs text-zinc-500">Chargement…</p>

  if (!hasSelection || messages.length === 0) {
    return (
      <div className="py-16 text-center">
        <MessageSquare className="mx-auto mb-3 size-9 text-zinc-700" />
        <p className="text-sm text-zinc-500">{hasSelection ? emptyLabel : noSelectionLabel}</p>
      </div>
    )
  }

  return (
    <>
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
    </>
  )
}
