'use client'

import { useState } from 'react'
import { Check, Edit3, X } from 'lucide-react'
import { parseAppointmentNotes, updateAppointmentNoteAt } from '@/lib/appointments/notes'
import { cn } from '@/lib/utils'
import { useLocale } from '@/contexts/LocaleContext'

type AppointmentNotesListProps = {
  note: string
  title: string
  accent?: 'lime' | 'blue' | 'zinc'
  canEdit?: boolean
  compact?: boolean
  onSave?: (nextNote: string) => Promise<void> | void
}

const ACCENT_CLASS = {
  lime: 'border-[#C8F135]/20 bg-[#C8F135]/[0.06] text-[#C8F135]',
  blue: 'border-blue-400/25 bg-blue-500/10 text-blue-400',
  zinc: 'border-zinc-800 bg-zinc-950/60 text-zinc-500',
}

/** Displays appointment notes as individual scrollable items so long histories do not stretch the appointment card. */
export function AppointmentNotesList({ note, title, accent = 'zinc', canEdit = false, compact = false, onSave }: AppointmentNotesListProps) {
  const { t } = useLocale()
  const entries = parseAppointmentNotes(note)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  if (entries.length === 0) return null

  const startEdit = (index: number) => {
    setEditingIndex(index)
    setDraft(entries[index]?.content ?? '')
  }

  const saveEdit = async () => {
    if (editingIndex === null || !draft.trim() || !onSave) return
    setSaving(true)
    await onSave(updateAppointmentNoteAt(note, editingIndex, draft))
    setSaving(false)
    setEditingIndex(null)
  }

  return (
    <section className={cn('rounded-xl border', compact ? 'px-2.5 py-2' : 'px-3 py-2.5', ACCENT_CLASS[accent])}>
      <div className={cn('flex items-center justify-between gap-2', compact ? 'mb-1.5' : 'mb-2')}>
        <p className="text-[10px] font-semibold uppercase tracking-widest">{title}</p>
        <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
          {entries.length}
        </span>
      </div>

      <div className={cn('space-y-2 overflow-y-auto pr-1', compact ? 'max-h-32' : 'max-h-44')}>
        {entries.map((entry, index) => {
          const isEditing = editingIndex === index
          return (
            <article key={`${entry.header ?? 'note'}-${index}`} className={cn('rounded-lg border border-zinc-800 bg-zinc-950/70 text-zinc-300', compact ? 'p-2' : 'p-2.5')}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                  {entry.header ?? `${t('appointmentNotes.note')} ${index + 1}`}
                </p>
                {canEdit && !isEditing && (
                  <button
                    type="button"
                    onClick={() => startEdit(index)}
                    className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-[#C8F135]"
                    aria-label={`${t('appointmentNotes.editNote')} ${index + 1}`}
                    title={t('appointmentNotes.editThisNote')}
                  >
                    <Edit3 className="size-3.5" />
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={draft}
                    onChange={event => setDraft(event.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-xs text-white outline-none focus:border-[#C8F135]"
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingIndex(null)}
                      className="rounded-md bg-zinc-800 p-1.5 text-zinc-400 hover:text-white"
                      aria-label={t('appointmentNotes.cancelEdit')}
                    >
                      <X className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={saving || !draft.trim()}
                      className="rounded-md bg-[#C8F135] p-1.5 text-zinc-950 disabled:opacity-50"
                      aria-label={t('appointmentNotes.saveNote')}
                    >
                      <Check className="size-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <p className={cn('whitespace-pre-wrap break-words text-xs text-zinc-300', compact ? 'leading-4' : 'leading-5')}>{entry.content}</p>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
