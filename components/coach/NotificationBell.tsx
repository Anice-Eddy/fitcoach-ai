'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Notification {
  id:        string
  type:      string
  title:     string
  message:   string
  relatedId: string | null
  isRead:    boolean
  createdAt: string
}

function notificationLink(notif: Notification) {
  if (notif.type === 'MESSAGE') {
    if (notif.title.toLowerCase().includes('note')) return notif.relatedId ? `/coach/notes?noteId=${encodeURIComponent(notif.relatedId)}` : '/coach/notes'
    const suffix = notif.relatedId ? `?chatId=${encodeURIComponent(notif.relatedId)}` : ''
    return `/coach/messages${suffix}`
  }
  if (notif.type === 'APPOINTMENT') return '/coach/appointments'
  if (notif.type === 'NEW_MEMBER') return '/coach/members'
  return '/coach/dashboard'
}

/** Bell icon with unread badge that polls /api/coach/notifications every 30 s; clicking a notification marks it read and navigates to the relevant page. */
export function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount]     = useState(0)
  const [isOpen, setIsOpen]               = useState(false)
  const [isLoading, setIsLoading]         = useState(false)

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res  = await fetch('/api/coach/notifications')
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch {
      // silent
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/coach/notifications', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ notificationId, isRead: true }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // silent
    }
  }

  const handleNotificationClick = async (notif: Notification) => {
    setIsOpen(false)
    if (!notif.isRead) await markAsRead(notif.id)
    router.push(notificationLink(notif))
  }

  const markAllAsRead = async () => {
    setIsLoading(true)
    await Promise.all(
      notifications.filter((n) => !n.isRead).map((n) => markAsRead(n.id)),
    )
    setIsLoading(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="relative p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-[#C8F135] text-[10px] font-bold text-zinc-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={isLoading}
                className="text-xs text-zinc-400 hover:text-[#C8F135] transition-colors disabled:opacity-50"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-zinc-500">
                Aucune notification
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {notifications.map((notif) => (
                  <button
                    key={notif.id}
                    type="button"
                    className={cn(
                      'w-full text-left px-4 py-3 transition-colors hover:bg-zinc-900',
                      !notif.isRead && 'bg-zinc-900/60',
                    )}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-medium truncate', notif.isRead ? 'text-zinc-300' : 'text-white')}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-xs text-zinc-600 mt-1">
                          {new Date(notif.createdAt).toLocaleDateString('fr-FR', {
                            day:    '2-digit',
                            month:  'short',
                            hour:   '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="mt-1 size-2 shrink-0 rounded-full bg-[#C8F135]" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  )
}
