import { describe, expect, it } from 'vitest'
import { getMessages, translate, type Locale } from '@/lib/i18n'
import { notificationDisplay } from '@/lib/notifications/display'
import { getUnreadCommunicationCounts } from '@/lib/notifications/unread-communication'

function t(locale: Locale) {
  const messages = getMessages(locale)
  return (key: string) => translate(messages, key)
}

describe('notificationDisplay', () => {
  it('localizes legacy French appointment-note notifications', () => {
    const display = notificationDisplay({
      type:    'MESSAGE',
      title:   'Note d\'un membre',
      message: 'A member added a note to your appointment "Bilan".',
    }, t('en'), 'en')

    expect(display.title).toBe('Member note')
    expect(display.message).toContain('"Bilan"')
  })

  it('localizes new English shared-note notifications in French', () => {
    const display = notificationDisplay({
      type:    'MESSAGE',
      title:   'Shared note: Nutrition',
      message: 'Your coach shared a note: Nutrition',
    }, t('fr'), 'fr')

    expect(display.title).toBe('Nouvelle note partagée')
    expect(display.message).toContain('Nutrition')
  })

  it('keeps user-authored message excerpts as the notification body', () => {
    const display = notificationDisplay({
      type:    'MESSAGE',
      title:   'New member message',
      message: 'Salut coach, question rapide.',
    }, t('fr'), 'fr')

    expect(display.title).toBe('Nouveau message membre')
    expect(display.message).toBe('Salut coach, question rapide.')
  })

  it('does not count appointment-note notifications as note inbox badges', () => {
    expect(getUnreadCommunicationCounts([
      {
        type: 'MESSAGE',
        title: 'Appointment note from member',
        message: 'A member added a note to your appointment "Bilan".',
        isRead: false,
      },
      {
        type: 'MESSAGE',
        title: 'Reply to your note',
        message: 'A member replied to your note "Nutrition".',
        isRead: false,
      },
    ])).toEqual({ messages: 0, notes: 1 })
  })

  it('does not count legacy French appointment-note notifications as note inbox badges', () => {
    expect(getUnreadCommunicationCounts([
      {
        type: 'MESSAGE',
        title: 'Note d\'un membre',
        message: 'Un membre a ajouté une note à votre rendez-vous "Bilan".',
        isRead: false,
      },
      {
        type: 'MESSAGE',
        title: 'Nouveau message membre',
        message: 'Question rapide.',
        isRead: false,
      },
    ])).toEqual({ messages: 1, notes: 0 })
  })
})
