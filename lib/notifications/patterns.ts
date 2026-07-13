export type NotificationPatternInput = {
  type?: string | null
  title?: string | null
  message?: string | null
}

function normalizedText(notification: NotificationPatternInput) {
  return `${notification.title ?? ''} ${notification.message ?? ''}`.toLowerCase()
}

function includesAny(text: string, patterns: string[]) {
  return patterns.some((pattern) => text.includes(pattern))
}

/** Matches both current English notification payloads and older French payloads kept in user databases. */
export function isAppointmentNotification(notification: NotificationPatternInput) {
  const text = normalizedText(notification)
  return notification.type === 'APPOINTMENT' ||
    includesAny(text, ['appointment', 'rendez-vous'])
}

/** Detects appointment-note notifications so they route to appointments, not the general notes inbox. */
export function isAppointmentNoteNotification(notification: NotificationPatternInput) {
  const text = normalizedText(notification)
  return includesAny(text, [
    'appointment note',
    'note from member',
    'added a note to your appointment',
    'note de votre coach',
    "note d'un membre",
    'note à votre rendez-vous',
  ])
}

/** Detects shared coach/member note notifications that belong in the notes inbox. */
export function isSharedNoteNotification(notification: NotificationPatternInput) {
  const text = normalizedText(notification)
  return includesAny(text, ['shared note', 'nouvelle note'])
}

/** Detects reply notifications for coach/member notes. */
export function isNoteReplyNotification(notification: NotificationPatternInput) {
  const text = normalizedText(notification)
  return includesAny(text, [
    'coach reply on a note',
    'reply to your note',
    'replied to your note',
    'réponse à votre note',
  ])
}

/** Detects plain chat-message notifications, excluding notes and appointments. */
export function isChatMessageNotification(notification: NotificationPatternInput) {
  const text = normalizedText(notification)
  return notification.type === 'MESSAGE' &&
    !isAppointmentNoteNotification(notification) &&
    !isSharedNoteNotification(notification) &&
    !isNoteReplyNotification(notification) &&
    includesAny(text, ['message'])
}
