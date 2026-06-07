'use client'

import { useEffect, useState } from 'react'
import { getUnreadCommunicationCounts, type CommunicationNotification, type UnreadCommunicationCounts } from './unread-communication'

type NotificationsResponse = CommunicationNotification[] | { notifications?: CommunicationNotification[] }

function notificationListFromResponse(data: NotificationsResponse) {
  if (Array.isArray(data)) return data
  return Array.isArray(data.notifications) ? data.notifications : []
}

/** Polls a notifications endpoint and returns unread message/note counts for menu badges. */
function useUnreadCommunicationCountsForEndpoint(endpoint: string) {
  const [counts, setCounts] = useState<UnreadCommunicationCounts>({ messages: 0, notes: 0 })

  useEffect(() => {
    let alive = true

    const fetchCount = async () => {
      const res = await fetch(endpoint).catch(() => null)
      if (!res?.ok) return
      const data = await res.json().catch(() => [])
      if (!alive) return
      setCounts(getUnreadCommunicationCounts(notificationListFromResponse(data as NotificationsResponse)))
    }

    fetchCount()
    const interval = window.setInterval(fetchCount, 30000)
    window.addEventListener('focus', fetchCount)
    window.addEventListener('bodyops:notifications-read', fetchCount)
    return () => {
      alive = false
      window.clearInterval(interval)
      window.removeEventListener('focus', fetchCount)
      window.removeEventListener('bodyops:notifications-read', fetchCount)
    }
  }, [endpoint])

  return counts
}

/** Polls member notifications and returns unread communication counts for menu badges. */
export function useUnreadCommunicationCounts() {
  return useUnreadCommunicationCountsForEndpoint('/api/user/notifications')
}

/** Polls coach notifications and returns unread communication counts for menu badges. */
export function useUnreadCoachCommunicationCounts() {
  return useUnreadCommunicationCountsForEndpoint('/api/coach/notifications')
}

/** Polls member notifications and returns unread chat-message count for menu badges. */
export function useUnreadMessageCount() {
  return useUnreadCommunicationCounts().messages
}

/** Polls member notifications and returns unread shared-note count for menu badges. */
export function useUnreadNoteCount() {
  return useUnreadCommunicationCounts().notes
}
