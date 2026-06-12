export type CommunicationNotification = {
  type?: string
  title?: string
  message?: string
  isRead?: boolean
}

export type UnreadCommunicationCounts = {
  messages: number
  notes: number
}

function unreadMessageTitle(notification: CommunicationNotification) {
  return (notification.title ?? '').toLowerCase()
}

function isAppointmentRelated(notification: CommunicationNotification) {
  const text = `${notification.title ?? ''} ${notification.message ?? ''}`.toLowerCase()
  return text.includes('rendez-vous')
}

export function getUnreadCommunicationCounts(notifications: CommunicationNotification[]): UnreadCommunicationCounts {
  return notifications.reduce<UnreadCommunicationCounts>((counts, notification) => {
    if (notification.type !== 'MESSAGE' || notification.isRead !== false) return counts
    if (isAppointmentRelated(notification)) return counts

    const title = unreadMessageTitle(notification)
    if (title.includes('message')) counts.messages += 1
    if (title.includes('note')) counts.notes += 1

    return counts
  }, { messages: 0, notes: 0 })
}

export function unreadCountForRoute(href: string, counts: UnreadCommunicationCounts) {
  if (href === '/messages' || href === '/coach/messages') return counts.messages
  if (href === '/notes' || href === '/coach/notes') return counts.notes
  return 0
}
