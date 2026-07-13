import { Send } from 'lucide-react'
import { useLocale } from '@/contexts/LocaleContext'

type MessageInputProps = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  placeholder: string
  disabled?: boolean
  sending?: boolean
}

/** Shared text input for chat messages; Enter sends and Shift+Enter inserts a newline. */
export function MessageInput({ value, onChange, onSend, placeholder, disabled, sending }: MessageInputProps) {
  const { t } = useLocale()

  return (
    <div className="border-t border-zinc-800 p-3">
      <div className="flex min-w-0 gap-2">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }}
          rows={2}
          maxLength={2000}
          disabled={disabled}
          placeholder={placeholder}
          className="min-h-10 min-w-0 flex-1 resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#C8F135] disabled:opacity-50"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={sending || disabled || !value.trim()}
          className="shrink-0 self-end rounded-xl bg-[#C8F135] p-3 text-zinc-950 transition-colors hover:bg-[#d4f54d] disabled:opacity-50"
          aria-label={t('messagesPage.sendMessageAria')}
        >
          <Send className="size-4" />
        </button>
      </div>
    </div>
  )
}
