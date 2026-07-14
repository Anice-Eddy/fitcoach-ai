export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { attachReplyAuthor, getNormalizedCoachNoteReplies } from '@/lib/notes/replies'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const replySchema = z.object({
  content: z.string().min(1).max(2000),
})

/** Returns all replies for the shared note, ordered by creation date ascending; verifies member access. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  // Verify member owns access to this note
  const note = await prisma.coachNote.findFirst({
    where: { id: (await params).noteId, memberId: session.user.id, isSharedWithMember: true },
  })
  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

  const replies = await getNormalizedCoachNoteReplies((await params).noteId)

  return NextResponse.json(replies)
}

/** Adds a member reply to the shared coach note and notifies the coach. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const note = await prisma.coachNote.findFirst({
    where: { id: (await params).noteId, memberId: session.user.id, isSharedWithMember: true },
  })
  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

  const parsed = replySchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const reply = await prisma.coachNoteReply.create({
    data: {
      noteId:   (await params).noteId,
      memberId: session.user.id,
      content:  parsed.data.content,
    },
    include: {
      member: { select: { name: true, image: true } },
    },
  })
  await attachReplyAuthor(reply.id, session.user.id, 'MEMBER')

  // Notify coach of the reply
  await prisma.notification.create({
    data: {
      coachId:         note.coachId,
      recipientUserId: null,
      type:            'MESSAGE',
      title:           'Reply to your note',
      message:         `A member replied to your note "${note.title}"`,
      relatedId:       note.id,
    },
  }).catch(() => {})

  return NextResponse.json({ ...reply, authorUserId: session.user.id, authorRole: 'MEMBER' }, { status: 201 })
}

/** Deletes the member's own reply (by replyId in body) from the note. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { replyId } = await req.json()
  if (!replyId) return NextResponse.json({ error: 'Missing replyId' }, { status: 400 })

  const reply = await prisma.coachNoteReply.findFirst({
    where: { id: replyId, noteId: (await params).noteId, memberId: session.user.id },
  })
  if (!reply) return NextResponse.json({ error: 'Reply not found' }, { status: 404 })

  await prisma.coachNoteReply.delete({ where: { id: replyId } })
  return NextResponse.json({ ok: true })
}
