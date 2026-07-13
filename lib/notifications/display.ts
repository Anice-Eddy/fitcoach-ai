import type { Locale } from '@/lib/i18n'
import {
  isAppointmentNoteNotification,
  isAppointmentNotification,
  isNoteReplyNotification,
  isSharedNoteNotification,
} from './patterns'

export type NotificationDisplayInput = {
  type?: string | null
  title?: string | null
  message?: string | null
}

type NotificationDisplay = {
  title:   string
  message: string
}

type Translate = (key: string) => string

function firstValueAfterColon(value: string | null | undefined) {
  const text = value ?? ''
  const index = text.indexOf(':')
  return index >= 0 ? text.slice(index + 1).trim() : null
}

function quotedValue(value: string | null | undefined) {
  return (value ?? '').match(/"([^"]+)"/)?.[1] ?? null
}

function withValue(template: string, value: string) {
  return template.replace('{value}', value)
}

/** Returns localized display text for known notification shapes while preserving stored DB payloads. */
export function notificationDisplay(notification: NotificationDisplayInput, t: Translate, _locale: Locale): NotificationDisplay {
  const text = `${notification.title ?? ''} ${notification.message ?? ''}`.toLowerCase()
  const fallback = {
    title:   notification.title ?? t('notifications.genericTitle'),
    message: notification.message ?? '',
  }

  if (text.includes('coach reply on a note') || text.includes('your coach replied to the note')) {
    const title = quotedValue(notification.message) ?? firstValueAfterColon(notification.title) ?? ''
    return {
      title:   t('notifications.types.coachNoteReply.title'),
      message: title ? withValue(t('notifications.types.coachNoteReply.message'), title) : t('notifications.types.coachNoteReply.messageGeneric'),
    }
  }

  if (isNoteReplyNotification(notification) && !text.includes('coach reply on a note') && !text.includes('your coach replied to the note')) {
    const title = quotedValue(notification.message) ?? firstValueAfterColon(notification.title) ?? ''
    return {
      title:   t('notifications.types.memberNoteReply.title'),
      message: title ? withValue(t('notifications.types.memberNoteReply.message'), title) : t('notifications.types.memberNoteReply.messageGeneric'),
    }
  }

  if (isSharedNoteNotification(notification)) {
    const title = firstValueAfterColon(notification.title) ?? firstValueAfterColon(notification.message) ?? ''
    return {
      title:   t('notifications.types.sharedNote.title'),
      message: title ? withValue(t('notifications.types.sharedNote.message'), title) : t('notifications.types.sharedNote.messageGeneric'),
    }
  }

  if (isAppointmentNotification(notification) && text.includes('appointment confirmed')) {
    const title = quotedValue(notification.message) ?? ''
    return {
      title:   t('notifications.types.appointmentConfirmed.title'),
      message: title ? withValue(t('notifications.types.appointmentConfirmed.message'), title) : t('notifications.types.appointmentConfirmed.messageGeneric'),
    }
  }

  if (isAppointmentNotification(notification) && (text.includes('appointment proposal') || text.includes('nouvelle proposition'))) {
    const title = quotedValue(notification.message) ?? ''
    return {
      title:   t('notifications.types.appointmentProposal.title'),
      message: title ? withValue(t('notifications.types.appointmentProposal.message'), title) : t('notifications.types.appointmentProposal.messageGeneric'),
    }
  }

  if (isAppointmentNoteNotification(notification)) {
    const title = quotedValue(notification.message) ?? ''
    const isCoachNote = text.includes('your coach') || text.includes('note de votre coach')
    const key = isCoachNote ? 'coachAppointmentNote' : 'memberAppointmentNote'
    return {
      title:   t(`notifications.types.${key}.title`),
      message: title ? withValue(t(`notifications.types.${key}.message`), title) : t(`notifications.types.${key}.messageGeneric`),
    }
  }

  if (isAppointmentNotification(notification) && (text.includes('new appointment') || text.includes('nouveau rendez-vous'))) {
    const title = firstValueAfterColon(notification.title) ?? ''
    return {
      title:   t('notifications.types.newAppointment.title'),
      message: title ? withValue(t('notifications.types.newAppointment.message'), title) : t('notifications.types.newAppointment.messageGeneric'),
    }
  }

  if (isAppointmentNotification(notification) && (text.includes('appointment request') || text.includes('nouvelle demande'))) {
    const title = firstValueAfterColon(notification.title) ?? ''
    return {
      title:   t('notifications.types.appointmentRequest.title'),
      message: title ? withValue(t('notifications.types.appointmentRequest.message'), title) : t('notifications.types.appointmentRequest.messageGeneric'),
    }
  }

  if (text.includes('new coach message') || text.includes('nouveau message de votre coach')) {
    return { title: t('notifications.types.coachMessage.title'), message: notification.message ?? '' }
  }

  if (text.includes('new member message') || text.includes('nouveau message membre')) {
    return { title: t('notifications.types.memberMessage.title'), message: notification.message ?? '' }
  }

  if (text.includes('new client') || text.includes('new member') || text.includes('nouveau client') || text.includes('nouveau membre')) {
    const name = firstValueAfterColon(notification.title) ?? ''
    return {
      title:   t('notifications.types.newMember.title'),
      message: name ? withValue(t('notifications.types.newMember.message'), name) : t('notifications.types.newMember.messageGeneric'),
    }
  }

  return fallback
}
