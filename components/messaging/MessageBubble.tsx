import { format } from 'date-fns'
import { enUS, fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useLocale } from '@/contexts/LocaleContext'

export type MessageBubbleData = {
  id: string
  content: string
  readAt: string | null
  createdAt: string
}

type MessageBubbleProps = {
  message: MessageBubbleData
  mine: boolean
  label: string
  showReadStatus?: boolean
}

/** Shared chat bubble with sender label, timestamp and optional read status. */
export function MessageBubble({ message, mine, label, showReadStatus }: MessageBubbleProps) {
  const { locale, t } = useLocale()
  const dateLocale = locale === 'fr' ? fr : enUS

  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'min-w-0 max-w-[88%] rounded-2xl px-3 py-2 text-sm sm:max-w-[82%] lg:max-w-[min(82%,42rem)]',
        mine ? 'bg-[#C8F135] text-zinc-950' : 'bg-zinc-800 text-zinc-100',
      )}>
        <p className={cn('mb-1 text-[10px] font-bold uppercase tracking-widest', mine ? 'text-zinc-700' : 'text-[#C8F135]')}>
          {label}
        </p>
        <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.content}</p>
        <p className={cn('mt-1 text-[10px]', mine ? 'text-zinc-700' : 'text-zinc-500')}>
          {format(new Date(message.createdAt), 'd MMM · HH:mm', { locale: dateLocale })}
          {showReadStatus && message.readAt ? ` · ${t('messagesPage.read')}` : ''}
        </p>
      </div>
    </div>
  )
}
