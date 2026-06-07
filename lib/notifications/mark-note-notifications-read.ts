'use client'

type NotificationItem = {
  id: string
  type?: string
  title?: string
  isRead?: boolean
}

function isUnreadNoteNotification(notification: NotificationItem) {
  return notification.type === 'MESSAGE'
    && notification.isRead === false
    && (notification.title ?? '').toLowerCase().includes('note')
}

async function markNotificationsRead(endpoint: string, items: NotificationItem[], coach: boolean) {
  const noteNotifications = items.filter(isUnreadNoteNotification)

  await Promise.all(noteNotifications.map((notification) =>
    fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(coach
        ? { notificationId: notification.id, isRead: true }
        : { notificationId: notification.id }),
    }).catch(() => null),
  ))

  // Tell nav badges to refetch immediately after notes have been marked as read.
  if (noteNotifications.length > 0 && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('bodyops:notifications-read'))
  }
}

/** Marks member note notifications as read when the member opens the Notes page. */
export async function markMemberNoteNotificationsRead() {
  const res = await fetch('/api/user/notifications').catch(() => null)
  if (!res?.ok) return
  const data = await res.json().catch(() => [])
  if (!Array.isArray(data)) return
  await markNotificationsRead('/api/user/notifications', data, false)
}

/** Marks coach note notifications as read when the coach opens the Notes page. */
export async function markCoachNoteNotificationsRead() {
  const res = await fetch('/api/coach/notifications').catch(() => null)
  if (!res?.ok) return
  const data = await res.json().catch(() => null)
  const notifications = Array.isArray(data?.notifications) ? data.notifications : []
  await markNotificationsRead('/api/coach/notifications', notifications, true)
}
