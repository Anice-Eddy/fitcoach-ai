import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    coachMember: {
      findUnique: vi.fn(),
    },
    coachChat: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
    coachChatMessage: {
      updateMany: vi.fn(),
      findMany:   vi.fn(),
      create:     vi.fn(),
    },
    notification: {
      create:     vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { POST as coachPost } from '@/app/api/coach/members/[memberId]/chat/route'
import { GET as memberGet } from '@/app/api/user/coach-chat/[coachProfileId]/route'

function req(body: unknown) {
  return new Request('http://localhost/api/test', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

describe('coach/member chat API', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ;(prisma.coachChat.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'chat-1' })
    ;(prisma.coachChatMessage.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 })
    ;(prisma.coachChatMessage.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])
    ;(prisma.coachChat.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'chat-1' })
    ;(prisma.notification.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 })
    ;(prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(callback => callback({
      coachChatMessage: { create: prisma.coachChatMessage.create },
      coachChat: { update: prisma.coachChat.update },
      notification: { create: prisma.notification.create },
    }))
  })

  it('permet au coach d’envoyer un message à un membre suivi', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { email: 'coach@test.com' } })
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'coach-user',
      coachProfile: { id: 'coach-profile' },
    })
    ;(prisma.coachMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      coachId: 'coach-profile',
      memberId: 'member-1',
    })
    ;(prisma.coachChatMessage.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'msg-1',
      chatId: 'chat-1',
      senderUserId: 'coach-user',
      content: 'Salut',
      createdAt: new Date(),
    })

    const res = await coachPost(req({ content: 'Salut' }) as never, { params: { memberId: 'member-1' } })

    expect(res.status).toBe(201)
    expect(prisma.coachChat.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { coachId_memberId: { coachId: 'coach-profile', memberId: 'member-1' } },
    }))
    expect(prisma.coachChatMessage.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ chatId: 'chat-1', senderUserId: 'coach-user', content: 'Salut' }),
    }))
    expect(prisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        coachId: 'coach-profile',
        recipientUserId: 'member-1',
        type: 'MESSAGE',
        title: 'Nouveau message de votre coach',
        relatedId: 'chat-1',
      }),
    }))
  })

  it('permet au membre de lire le fil avec un coach assigné', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'member-1' } })
    ;(prisma.coachMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      coachId: 'coach-profile',
      memberId: 'member-1',
      coachProfile: { id: 'coach-profile', user: { id: 'coach-user', name: 'Coach' } },
    })

    const res = await memberGet(new Request('http://localhost/api/test') as never, {
      params: { coachProfileId: 'coach-profile' },
    })

    expect(res.status).toBe(200)
    expect(prisma.coachChatMessage.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { chatId: 'chat-1', senderUserId: { not: 'member-1' }, readAt: null },
    }))
    expect(prisma.notification.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { recipientUserId: 'member-1', relatedId: 'chat-1', isRead: false },
      data: { isRead: true },
    }))
  })
})
