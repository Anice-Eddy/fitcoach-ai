export function appendAppointmentNote(currentNote: string | null | undefined, nextNote: string, authorLabel: string, locale: 'fr' | 'en' = 'fr') {
  const next = nextNote.trim()
  const current = currentNote?.trim() ?? ''
  if (!next) return current
  if (!current) return next

  // Appointments currently store notes in one text field, so append the new note below the previous one.
  const date = new Date().toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  })

  return `${current}\n\n[${authorLabel} - ${date}]\n${next}`
}

export type AppointmentNoteEntry = {
  header: string | null
  content: string
}

const NOTE_MARKER_RE = /^\[([^\]]+)\]\n([\s\S]*)$/
const NOTE_MARKER_GLOBAL_RE = /\[[^\]]+\]\n/g

export function parseAppointmentNotes(note: string | null | undefined): AppointmentNoteEntry[] {
  const text = note?.trim()
  if (!text) return []

  const markerMatches = Array.from(text.matchAll(NOTE_MARKER_GLOBAL_RE))
  if (markerMatches.length === 0) return [{ header: null, content: text }]

  const entries: AppointmentNoteEntry[] = []
  const firstMarkerIndex = markerMatches[0].index ?? 0
  if (firstMarkerIndex > 0) {
    const legacy = text.slice(0, firstMarkerIndex).trim()
    if (legacy) entries.push({ header: null, content: legacy })
  }

  markerMatches.forEach((match, index) => {
    const start = match.index ?? 0
    const end = index + 1 < markerMatches.length ? markerMatches[index + 1].index ?? text.length : text.length
    const raw = text.slice(start, end).trim()
    const parsed = raw.match(NOTE_MARKER_RE)
    if (!parsed) return
    entries.push({ header: parsed[1], content: parsed[2].trim() })
  })

  return entries
}

export function serializeAppointmentNotes(entries: AppointmentNoteEntry[]) {
  return entries
    .map(entry => entry.header ? `[${entry.header}]\n${entry.content.trim()}` : entry.content.trim())
    .filter(Boolean)
    .join('\n\n')
}

export function updateAppointmentNoteAt(note: string | null | undefined, index: number, content: string) {
  const entries = parseAppointmentNotes(note)
  if (!entries[index]) return note?.trim() ?? ''

  // Current storage is a single text field: edit only the selected segment, then serialize it again.
  entries[index] = { ...entries[index], content }
  return serializeAppointmentNotes(entries)
}
