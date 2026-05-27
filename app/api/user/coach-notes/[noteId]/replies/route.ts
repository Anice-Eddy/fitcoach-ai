export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const replySchema = z.object({
  content: z.string().min(1).max(2000),
})

/** Returns all replies for the shared note, ordered by creation date ascending; verifies member access. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { noteId: string } },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // Verify member owns access to this note
  const note = await prisma.coachNote.findFirst({
    where: { id: params.noteId, memberId: session.user.id, isSharedWithMember: true },
  })
  if (!note) return NextResponse.json({ error: 'Note introuvable' }, { status: 404 })

  const replies = await prisma.coachNoteReply.findMany({
    where: { noteId: params.noteId },
    include: { member: { select: { name: true, image: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(replies)
}

/** Adds a member reply to the shared coach note and notifies the coach. */
export async function POST(
  req: NextRequest,
  { params }: { params: { noteId: string } },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const note = await prisma.coachNote.findFirst({
    where: { id: params.noteId, memberId: session.user.id, isSharedWithMember: true },
  })
  if (!note) return NextResponse.json({ error: 'Note introuvable' }, { status: 404 })

  const parsed = replySchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const reply = await prisma.coachNoteReply.create({
    data: {
      noteId:   params.noteId,
      memberId: session.user.id,
      content:  parsed.data.content,
    },
    include: { member: { select: { name: true, image: true } } },
  })

  // Notify coach of the reply
  await prisma.notification.create({
    data: {
      coachId:         note.coachId,
      recipientUserId: null,
      type:            'MESSAGE',
      title:           'Réponse à votre note',
      message:         `Un membre a répondu à votre note "${note.title}"`,
      relatedId:       note.id,
    },
  }).catch(() => {})

  return NextResponse.json(reply, { status: 201 })
}

/** Deletes the member's own reply (by replyId in body) from the note. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { noteId: string } },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { replyId } = await req.json()
  if (!replyId) return NextResponse.json({ error: 'replyId manquant' }, { status: 400 })

  const reply = await prisma.coachNoteReply.findFirst({
    where: { id: replyId, noteId: params.noteId, memberId: session.user.id },
  })
  if (!reply) return NextResponse.json({ error: 'Réponse introuvable' }, { status: 404 })

  await prisma.coachNoteReply.delete({ where: { id: replyId } })
  return NextResponse.json({ ok: true })
}
