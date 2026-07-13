import { describe, expect, it } from 'vitest'
import { notificationHref } from '@/lib/notifications/notification-links'

describe('notificationHref', () => {
  it('opens the exact shared note for members', () => {
    expect(notificationHref({
      type: 'MESSAGE',
      title: 'Nouvelle note: nutrition',
      relatedId: 'note_123',
    }, 'member')).toBe('/notes?tab=coach&noteId=note_123')
  })

  it('opens English shared note notifications for members', () => {
    expect(notificationHref({
      type: 'MESSAGE',
      title: 'Shared note: nutrition',
      relatedId: 'note_456',
    }, 'member')).toBe('/notes?tab=coach&noteId=note_456')
  })

  it('opens the exact note for coaches', () => {
    expect(notificationHref({
      type: 'MESSAGE',
      title: 'Réponse à votre note',
      relatedId: 'note_123',
    }, 'coach')).toBe('/coach/notes?noteId=note_123')
  })

  it('keeps chat notifications on conversations', () => {
    expect(notificationHref({
      type: 'MESSAGE',
      title: 'Nouveau message membre',
      relatedId: 'chat_123',
    }, 'coach')).toBe('/coach/messages?chatId=chat_123')
  })

  it('keeps appointment notifications on appointments', () => {
    expect(notificationHref({
      type: 'APPOINTMENT',
      title: 'Nouvelle demande',
      relatedId: 'appointment_123',
    }, 'coach')).toBe('/coach/appointments?id=appointment_123')
  })

  it('opens appointment notes on the related appointment for coaches', () => {
    expect(notificationHref({
      type: 'MESSAGE',
      title: "Note d'un membre",
      message: 'Un membre a ajouté une note à votre rendez-vous "Bilan".',
      relatedId: 'appointment_123',
    }, 'coach')).toBe('/coach/appointments?id=appointment_123')
  })

  it('opens English appointment-note messages on the related appointment for coaches', () => {
    expect(notificationHref({
      type: 'MESSAGE',
      title: 'Appointment note from member',
      message: 'A member added a note to your appointment "Bilan".',
      relatedId: 'appointment_456',
    }, 'coach')).toBe('/coach/appointments?id=appointment_456')
  })

  it('opens appointment notes on the related appointment for members', () => {
    expect(notificationHref({
      type: 'APPOINTMENT',
      title: 'Note de votre coach',
      message: 'Votre coach a ajouté une note à votre rendez-vous "Bilan".',
      relatedId: 'appointment_123',
    }, 'member')).toBe('/appointments?id=appointment_123')
  })
})
