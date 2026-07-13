'use client'

import { useCallback, useEffect, useState } from 'react'
import { ConversationList, type ConversationItemData } from '@/components/messaging/ConversationList'
import { MessageInput } from '@/components/messaging/MessageInput'
import { MessageThread } from '@/components/messaging/MessageThread'
import { useSSE } from '@/hooks/useSSE'
import { CoachPageHeader } from '@/components/coach/CoachPageHeader'
import { useLocale } from '@/contexts/LocaleContext'

interface MemberItem {
  member: {
    id: string
    name: string | null
    email: string
    image: string | null
    profile?: { fitnessGoal: string; fitnessLevel: string } | null
  }
  assignedAt: string
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

function memberName(item: MemberItem) {
  return item.member.name || item.member.email
}

/** Coach messaging page: dedicated inbox separated from member management. */
export default function CoachMessagesPage() {
  const { t } = useLocale()
  const [members, setMembers] = useState<MemberItem[]>([])
  const [selected, setSelected] = useState<MemberItem | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [threadLoading, setThreadLoading] = useState(false)
  const [sending, setSending] = useState(false)

  const fetchMembers = useCallback(async () => {
    const res = await fetch('/api/coach/members').catch(() => null)
    const data = res ? await res.json().catch(() => []) : []
    const list: MemberItem[] = Array.isArray(data) ? data : []
    const chatId = new URLSearchParams(window.location.search).get('chatId')
    setMembers(list)
    setSelected(current => current ?? list.find(item => item.chat?.id === chatId) ?? list.find(item => item.chat?.unreadCount) ?? list[0] ?? null)
    setLoading(false)
  }, [])

  const fetchThread = useCallback(async (memberId: string) => {
    setThreadLoading(true)
    const res = await fetch(`/api/coach/members/${memberId}/chat`).catch(() => null)
    const data = res ? await res.json().catch(() => null) : null
    if (Array.isArray(data?.messages)) setMessages(data.messages)
    setMembers(prev => prev.map(item => item.member.id === memberId && item.chat ? {
      ...item,
      chat: { ...item.chat, unreadCount: 0 },
    } : item))
    setThreadLoading(false)
  }, [])

  useEffect(() => { fetchMembers() }, [fetchMembers])
  useEffect(() => { if (selected) fetchThread(selected.member.id) }, [fetchThread, selected])

  useSSE(useCallback((event) => {
    if (event.type !== 'message:new') return
    fetchMembers()
    if (selected) fetchThread(selected.member.id)
  }, [fetchMembers, fetchThread, selected]))

  const sendMessage = async () => {
    const text = content.trim()
    if (!selected || !text) return
    setSending(true)
    const res = await fetch(`/api/coach/members/${selected.member.id}/chat`, {
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

  const conversationItems: ConversationItemData[] = members.map(item => ({
    id: item.member.id,
    title: memberName(item),
    subtitle: item.member.email,
    initials: memberName(item).slice(0, 2).toUpperCase(),
    unreadCount: item.chat?.unreadCount ?? 0,
  }))

  return (
    <div className="space-y-8">
      <CoachPageHeader
        title={t('messagesPage.title')}
        description={t('messagesPage.coachSubtitle')}
      />

      <div className="grid h-[calc(100dvh-15rem)] min-h-[420px] grid-rows-[minmax(160px,32%)_1fr] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 lg:grid-cols-[320px_1fr] lg:grid-rows-none">
        <ConversationList
          title={t('messagesPage.conversations')}
          description={t('messagesPage.coachListDescription')}
          loading={loading}
          emptyLabel={t('messagesPage.noTrackedMember')}
          items={conversationItems}
          activeId={selected?.member.id ?? null}
          onSelect={(id) => setSelected(members.find(item => item.member.id === id) ?? null)}
        />

        <section className="flex min-h-0 flex-col">
          <div className="border-b border-zinc-800 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-white">{selected ? memberName(selected) : t('messagesPage.title')}</p>
              <span className="rounded-full border border-[#C8F135]/30 bg-[#C8F135]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#C8F135]">
                {t('messagesPage.coachSpace')}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500">{t('messagesPage.coachThreadDescription')}</p>
          </div>

          <div className="min-h-0 flex-1">
            <MessageThread
              loading={threadLoading}
              hasSelection={Boolean(selected)}
              emptyLabel={t('messagesPage.noMessage')}
              noSelectionLabel={t('messagesPage.selectMember')}
              messages={messages}
              isMine={(message) => Boolean(selected && message.senderUserId !== selected.member.id)}
              labelFor={(message, mine) => mine ? `${t('messagesPage.you')} · ${t('messagesPage.coach')}` : `${t('messagesPage.member')} · ${message.sender.name ?? (selected ? memberName(selected) : t('messagesPage.member'))}`}
            />
          </div>

          <MessageInput
            value={content}
            onChange={setContent}
            onSend={sendMessage}
            sending={sending}
            disabled={!selected}
            placeholder={selected ? t('messagesPage.writeMember') : t('messagesPage.selectMemberPlaceholder')}
          />
        </section>
      </div>
    </div>
  )
}
