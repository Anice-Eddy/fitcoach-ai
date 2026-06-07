'use client'

import { useCallback, useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ConversationList, type ConversationItemData } from '@/components/messaging/ConversationList'
import { MessageInput } from '@/components/messaging/MessageInput'
import { MessageThread } from '@/components/messaging/MessageThread'
import { useSSE } from '@/hooks/useSSE'

interface CoachRelation {
  coachProfileId: string
  coach: {
    id: string
    name: string | null
    email: string
    firstName: string | null
    lastName: string | null
    avatarUrl: string | null
  }
  chat?: { id: string; unreadCount: number; lastMessageAt: string | null } | null
}

interface ChatMessage {
  id: string
  senderUserId: string
  content: string
  readAt: string | null
  createdAt: string
  sender: { id: string; name: string | null; image: string | null }
}

function coachName(relation: CoachRelation) {
  const full = [relation.coach.firstName, relation.coach.lastName].filter(Boolean).join(' ')
  return full || relation.coach.name || relation.coach.email
}

/** Member messaging page: lets a member chat with assigned coaches while keeping notes for durable follow-up. */
export default function MessagesPage() {
  const [coaches, setCoaches]       = useState<CoachRelation[]>([])
  const [selected, setSelected]     = useState<CoachRelation | null>(null)
  const [messages, setMessages]     = useState<ChatMessage[]>([])
  const [content, setContent]       = useState('')
  const [loading, setLoading]       = useState(true)
  const [threadLoading, setThreadLoading] = useState(false)
  const [sending, setSending]       = useState(false)

  const fetchCoaches = useCallback(async () => {
    const res = await fetch('/api/user/my-coach').catch(() => null)
    const data = res?.ok ? await res.json().catch(() => ({ coaches: [] })) : { coaches: [] }
    const list = Array.isArray(data.coaches) ? data.coaches : []
    const chatId = new URLSearchParams(window.location.search).get('chatId')
    setCoaches(list)
    setSelected(current => current
      ? list.find((coach: CoachRelation) => coach.coachProfileId === current.coachProfileId) ?? current
      : list.find((coach: CoachRelation) => coach.chat?.id === chatId) ?? list[0] ?? null)
    setLoading(false)
  }, [])

  useEffect(() => { fetchCoaches() }, [fetchCoaches])

  const fetchThread = useCallback((coachProfileId: string) => {
    setThreadLoading(true)
    fetch(`/api/user/coach-chat/${coachProfileId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data?.messages)) setMessages(data.messages)
      })
      .finally(() => setThreadLoading(false))
    setCoaches(prev => prev.map(coach => coach.coachProfileId === coachProfileId && coach.chat ? {
      ...coach,
      chat: { ...coach.chat, unreadCount: 0 },
    } : coach))
  }, [])

  useEffect(() => {
    if (selected) fetchThread(selected.coachProfileId)
  }, [fetchThread, selected])

  useSSE(useCallback((event) => {
    if (event.type !== 'message:new') return
    fetchCoaches()
    if (selected) fetchThread(selected.coachProfileId)
  }, [fetchCoaches, fetchThread, selected]))

  const sendMessage = async () => {
    const text = content.trim()
    if (!selected || !text) return
    setSending(true)
    const res = await fetch(`/api/user/coach-chat/${selected.coachProfileId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text }),
    })
    if (res.ok) {
      const created = await res.json()
      setMessages(prev => [...prev, created])
      setContent('')
    }
    setSending(false)
  }

  const conversationItems: ConversationItemData[] = coaches.map(relation => ({
    id: relation.coachProfileId,
    title: coachName(relation),
    subtitle: relation.coach.email,
    initials: coachName(relation).slice(0, 2).toUpperCase(),
    unreadCount: relation.chat?.unreadCount ?? 0,
  }))

  return (
    <>
      <Header title="Messages" />
      <PageWrapper>
        <div className="grid min-h-[calc(100vh-10rem)] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 lg:grid-cols-[280px_1fr]">
          <ConversationList
            title="Mes coachs"
            description="Questions rapides et suivi quotidien."
            loading={loading}
            emptyLabel="Aucun coach assigné."
            items={conversationItems}
            activeId={selected?.coachProfileId ?? null}
            onSelect={(id) => setSelected(coaches.find(coach => coach.coachProfileId === id) ?? null)}
          />

          <section className="flex min-h-[520px] flex-col">
            <div className="border-b border-zinc-800 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-white">{selected ? coachName(selected) : 'Messages'}</p>
                <span className="rounded-full border border-[#C8F135]/30 bg-[#C8F135]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#C8F135]">
                  Espace membre
                </span>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">Pour les consignes importantes, ton coach peut les garder en notes.</p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              <MessageThread
                loading={threadLoading}
                hasSelection={Boolean(selected)}
                emptyLabel="Aucun message pour le moment."
                noSelectionLabel="Sélectionne un coach pour démarrer."
                messages={messages}
                isMine={(message) => Boolean(selected && message.senderUserId !== selected.coach.id)}
                labelFor={(message, mine) => mine ? 'Vous · Membre' : `Coach · ${message.sender.name ?? (selected ? coachName(selected) : 'Coach')}`}
              />
            </div>

            <MessageInput
              value={content}
              onChange={setContent}
              onSend={sendMessage}
              sending={sending}
              disabled={!selected}
              placeholder={selected ? 'Écrire au coach…' : 'Sélectionne un coach…'}
            />
          </section>
        </div>
      </PageWrapper>
    </>
  )
}
