export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { auth } from '@/lib/auth/auth'
import { emitToUser } from '@/lib/messaging/sse-manager'
import { prisma } from '@/lib/prisma/client'
import { RATE_LIMITS, rateLimitByUserId } from '@/lib/security/rate-limit'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const messageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
})

async function getMemberAccess(coachProfileId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }

  const membership = await prisma.coachMember.findUnique({
    where: { coachId_memberId: { coachId: coachProfileId, memberId: session.user.id } },
    include: { coachProfile: { include: { user: { select: { id: true, name: true, image: true } } } } },
  })
  if (!membership) return { error: NextResponse.json({ error: 'Coach introuvable' }, { status: 404 }) }

  return { memberId: session.user.id, membership }
}

async function ensureChat(coachId: string, memberId: string) {
  return prisma.coachChat.upsert({
    where:  { coachId_memberId: { coachId, memberId } },
    update: {},
    create: { coachId, memberId },
  })
}

/** Returns the member's chat thread with one assigned coach and marks coach messages as read. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { coachProfileId: string } },
) {
  const { memberId, membership, error } = await getMemberAccess(params.coachProfileId)
  if (error) return error

  const chat = await ensureChat(params.coachProfileId, memberId!)

  await prisma.coachChatMessage.updateMany({
    where: { chatId: chat.id, senderUserId: { not: memberId }, readAt: null },
    data:  { readAt: new Date() },
  })

  // Quand le membre ouvre la conversation, les notifications liées à ce chat disparaissent des non-lues.
  await prisma.notification.updateMany({
    where: {
      recipientUserId: memberId,
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

  return NextResponse.json({ chat, coach: membership!.coachProfile, messages })
}

/** Sends a member message to one assigned coach. */
export async function POST(
  req: NextRequest,
  { params }: { params: { coachProfileId: string } },
) {
  const { memberId, membership, error } = await getMemberAccess(params.coachProfileId)
  if (error) return error
  const limited = await rateLimitByUserId(memberId!, 'chat:member-to-coach', RATE_LIMITS.chat)
  if (!limited.ok) return limited.response

  const parsed = messageSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const chat = await ensureChat(params.coachProfileId, memberId!)

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.coachChatMessage.create({
      data: {
        chatId: chat.id,
        senderUserId: memberId!,
        content: parsed.data.content,
      },
      include: { sender: { select: { id: true, name: true, image: true } } },
    })

    await tx.coachChat.update({
      where: { id: chat.id },
      data:  { lastMessageAt: created.createdAt },
    })

    // Notifie le coach dans sa cloche; recipientUserId null signifie notification côté espace coach.
    await tx.notification.create({
      data: {
        coachId:         params.coachProfileId,
        recipientUserId: null,
        type:            'MESSAGE',
        title:           'Nouveau message membre',
        message:         created.content.slice(0, 140),
        relatedId:       chat.id,
      },
    })

    return created
  })

  emitToUser(membership!.coachProfile.user.id, { type: 'message:new', chatId: chat.id, messageId: message.id })

  return NextResponse.json(message, { status: 201 })
}
