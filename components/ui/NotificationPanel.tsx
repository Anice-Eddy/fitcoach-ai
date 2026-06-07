'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, X, CheckCheck } from 'lucide-react'

interface Notification {
  id:        string
  title:     string
  message:   string
  isRead:    boolean
  createdAt: string
  type?:     string
  relatedId: string | null
}

// Resolves the in-app navigation link for a notification based on its type and optional related entity id.
function resolveLink(type: string | undefined, relatedId: string | null, title: string): string {
  switch (type) {
    case 'MESSAGE':
      if (title.toLowerCase().includes('message')) return relatedId ? `/messages?chatId=${encodeURIComponent(relatedId)}` : '/messages'
      // Shared notes without a chat id keep the notes destination.
      return relatedId ? `/notes?tab=coach&noteId=${relatedId}` : '/notes?tab=coach'
    case 'APPOINTMENT':
      return relatedId ? `/appointments?id=${relatedId}` : '/appointments'
    case 'MEMBER_UPDATE':
      return '/dashboard'
    case 'SYSTEM':
      return '/dashboard'
    default:
      return '/dashboard'
  }
}

/** Member notification bell with dropdown panel; fetches unread count on mount, marks items read on click, and navigates to the relevant page. */
export function NotificationPanel() {
  const router                          = useRouter()
  const [open, setOpen]                 = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading]           = useState(false)
  const ref                             = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/user/notifications')
      .then(res => res.json())
      .then((data: Notification[]) => {
        if (Array.isArray(data)) setNotifications(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [open])

  const unread = notifications.filter(n => !n.isRead).length

  const markAllRead = async () => {
    await fetch('/api/user/notifications', { method: 'PATCH' })
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const handleClick = async (n: Notification) => {
    setOpen(false)
    if (!n.isRead) {
      await fetch('/api/user/notifications', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ notificationId: n.id }),
      }).catch(() => {})
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x))
    }
    const link = resolveLink(n.type, n.relatedId, n.title)
    router.push(link)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label="Notifications"
        className="relative rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-[#C8F135] text-zinc-900 text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <span className="text-sm font-semibold text-white">Notifications</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs text-zinc-500 hover:text-white flex items-center gap-1"
                >
                  <CheckCheck className="size-3" /> Tout lire
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="text-zinc-600 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-center text-sm text-zinc-500">Chargement…</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="size-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">Aucune notification</p>
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-zinc-800/50 last:border-0 transition-colors hover:bg-zinc-900 ${n.isRead ? '' : 'bg-zinc-900/60'}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && <div className="size-1.5 rounded-full bg-[#C8F135] mt-1.5 shrink-0" />}
                    <div className={!n.isRead ? '' : 'pl-3.5'}>
                      <p className="text-xs font-medium text-white">{n.title}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-zinc-600 mt-1">
                        {new Date(n.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
