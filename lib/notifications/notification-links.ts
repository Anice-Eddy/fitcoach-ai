import {
  isAppointmentNoteNotification,
  isAppointmentNotification,
  isNoteReplyNotification,
  isSharedNoteNotification,
} from './patterns'

type NotificationLinkInput = {
  type?: string | null
  title?: string | null
  message?: string | null
  relatedId?: string | null
}

type NotificationContext = 'member' | 'coach'

function relatedQuery(key: string, relatedId: string | null | undefined) {
  return relatedId ? `?${key}=${encodeURIComponent(relatedId)}` : ''
}

function isNoteNotification(notification: NotificationLinkInput) {
  return notification.type === 'MESSAGE' &&
    !isAppointmentNoteNotification(notification) &&
    (isSharedNoteNotification(notification) || isNoteReplyNotification(notification))
}

/** Builds the in-app destination for a notification using the same rules for every bell/menu. */
export function notificationHref(notification: NotificationLinkInput, context: NotificationContext) {
  const relatedId = notification.relatedId ?? null

  if (context === 'coach') {
    if (isAppointmentNotification(notification)) return `/coach/appointments${relatedQuery('id', relatedId)}`
    if (isNoteNotification(notification)) return `/coach/notes${relatedQuery('noteId', relatedId)}`
    if (notification.type === 'MESSAGE') return `/coach/messages${relatedQuery('chatId', relatedId)}`
    if (notification.type === 'NEW_MEMBER' || notification.type === 'MEMBER_UPDATE') {
      return `/coach/members${relatedQuery('memberId', relatedId)}`
    }
    return '/coach/dashboard'
  }

  if (isAppointmentNotification(notification)) return `/appointments${relatedQuery('id', relatedId)}`
  if (isNoteNotification(notification)) return `/notes?tab=coach${relatedId ? `&noteId=${encodeURIComponent(relatedId)}` : ''}`
  if (notification.type === 'MESSAGE') return `/messages${relatedQuery('chatId', relatedId)}`
  if (notification.type === 'MEMBER_UPDATE') return '/progress'
  return '/dashboard'
}
