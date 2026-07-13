export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { auth } from '@/lib/auth/auth'
import { emitToUser } from '@/lib/messaging/sse-manager'
import { prisma } from '@/lib/prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const messageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
})

async function getCoachAccess(memberId: string) {
  const session = await auth()
  if (!session?.user?.email) return { error: NextResponse.json({ error: 'Unauthenticated' }, { status: 401 }) }

  const coach = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { coachProfile: true },
  })
  if (!coach?.coachProfile) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) }

  const membership = await prisma.coachMember.findUnique({
    where: { coachId_memberId: { coachId: coach.coachProfile.id, memberId } },
  })
  if (!membership) return { error: NextResponse.json({ error: 'Member not found' }, { status: 404 }) }

  return { coach }
}

async function ensureChat(coachId: string, memberId: string) {
  return prisma.coachChat.upsert({
    where:  { coachId_memberId: { coachId, memberId } },
    update: {},
    create: { coachId, memberId },
  })
}

/** Returns the coach/member chat thread and marks member messages as read by the coach. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { memberId: string } },
) {
  const { coach, error } = await getCoachAccess(params.memberId)
  if (error) return error

  const chat = await ensureChat(coach!.coachProfile!.id, params.memberId)

  await prisma.coachChatMessage.updateMany({
    where: { chatId: chat.id, senderUserId: { not: coach!.id }, readAt: null },
    data:  { readAt: new Date() },
  })

  // When the coach opens the conversation, chat-related notifications are cleared from unread counts.
  await prisma.notification.updateMany({
    where: {
      coachId:         coach!.coachProfile!.id,
      recipientUserId: null,
      relatedId:       chat.id,
      isRead:          false,
    },
    data: { isRead: true },
  })

  const messages = await prisma.coachChatMessage.findMany({
    where: { chatId: chat.id },
    include: { sender: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: 'asc' },
    take: 100,
  })

  return NextResponse.json({ chat, messages })
}

/** Sends a coach message to a followed member. */
export async function POST(
  req: NextRequest,
  { params }: { params: { memberId: string } },
) {
  const { coach, error } = await getCoachAccess(params.memberId)
  if (error) return error

  const parsed = messageSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const chat = await ensureChat(coach!.coachProfile!.id, params.memberId)

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.coachChatMessage.create({
      data: {
        chatId: chat.id,
        senderUserId: coach!.id,
        content: parsed.data.content,
      },
      include: { sender: { select: { id: true, name: true, image: true } } },
    })

    await tx.coachChat.update({
      where: { id: chat.id },
      data:  { lastMessageAt: created.createdAt },
    })

    // Notify the member without marking the message as read; clicking opens their Messages area.
    await tx.notification.create({
      data: {
        coachId:         coach!.coachProfile!.id,
        recipientUserId: params.memberId,
        type:            'MESSAGE',
        title:           'New coach message',
        message:         created.content.slice(0, 140),
        relatedId:       chat.id,
      },
    })

    return created
  })

  emitToUser(params.memberId, { type: 'message:new', chatId: chat.id, messageId: message.id })

  return NextResponse.json(message, { status: 201 })
}
