import { describe, expect, it, vi } from 'vitest'
import { appendAppointmentNote, parseAppointmentNotes, updateAppointmentNoteAt } from '@/lib/appointments/notes'

describe('appendAppointmentNote', () => {
  it('returns the new note when there is no existing note', () => {
    expect(appendAppointmentNote(null, 'Prévoir bilan mobilité', 'Coach')).toBe('Prévoir bilan mobilité')
  })

  it('appends a new note below the existing content with the author label', () => {
    vi.setSystemTime(new Date('2026-06-12T14:30:00.000Z'))

    const result = appendAppointmentNote('Première note', 'Deuxième note', 'Membre')

    expect(result).toContain('Première note')
    expect(result).toContain('[Membre -')
    expect(result).toContain('Deuxième note')
  })

  it('parses legacy and timestamped notes as separate entries', () => {
    const entries = parseAppointmentNotes('Première note\n\n[Coach - 12/06/2026 10:00]\nDeuxième note')

    expect(entries).toEqual([
      { header: null, content: 'Première note' },
      { header: 'Coach - 12/06/2026 10:00', content: 'Deuxième note' },
    ])
  })

  it('updates only the selected note entry', () => {
    const result = updateAppointmentNoteAt(
      'Première note\n\n[Coach - 12/06/2026 10:00]\nDeuxième note',
      1,
      'Deuxième note corrigée',
    )

    expect(result).toContain('Première note')
    expect(result).toContain('[Coach - 12/06/2026 10:00]')
    expect(result).toContain('Deuxième note corrigée')
    expect(result).not.toContain('Deuxième note\n')
  })
})
