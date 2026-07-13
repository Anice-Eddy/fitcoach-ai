import {
  isAppointmentNotification,
  isChatMessageNotification,
  isNoteReplyNotification,
  isSharedNoteNotification,
} from './patterns'

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

export function getUnreadCommunicationCounts(notifications: CommunicationNotification[]): UnreadCommunicationCounts {
  return notifications.reduce<UnreadCommunicationCounts>((counts, notification) => {
    if (notification.type !== 'MESSAGE' || notification.isRead !== false) return counts
    if (isAppointmentNotification(notification)) return counts

    if (isChatMessageNotification(notification)) counts.messages += 1
    if (isSharedNoteNotification(notification) || isNoteReplyNotification(notification)) counts.notes += 1

    return counts
  }, { messages: 0, notes: 0 })
}

export function unreadCountForRoute(href: string, counts: UnreadCommunicationCounts) {
  if (href === '/messages' || href === '/coach/messages') return counts.messages
  if (href === '/notes' || href === '/coach/notes') return counts.notes
  return 0
}
