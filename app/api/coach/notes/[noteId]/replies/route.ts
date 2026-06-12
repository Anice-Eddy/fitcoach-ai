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

// Authenticates the session and returns the coachProfile record, or an error response.
async function getCoachProfile() {
  const session = await auth()
  if (!session?.user?.email) return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { coachProfile: true },
  })
  if (!user?.coachProfile) return { error: NextResponse.json({ error: 'Non autorisé' }, { status: 403 }) }
  return { coachProfile: user.coachProfile }
}

/** Returns all replies for the note (coach view), ordered by creation date ascending. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { noteId: string } },
) {
  const { coachProfile, error } = await getCoachProfile()
  if (error) return error

  const note = await prisma.coachNote.findFirst({
    where: { id: params.noteId, coachId: coachProfile!.id },
  })
  if (!note) return NextResponse.json({ error: 'Note introuvable' }, { status: 404 })

  const replies = await getNormalizedCoachNoteReplies(params.noteId)

  return NextResponse.json(replies)
}

/** Adds a coach reply to the note thread and notifies the member when the note is shared. */
export async function POST(
  req: NextRequest,
  { params }: { params: { noteId: string } },
) {
  const { coachProfile, error } = await getCoachProfile()
  if (error) return error

  const note = await prisma.coachNote.findFirst({
    where: { id: params.noteId, coachId: coachProfile!.id },
  })
  if (!note) return NextResponse.json({ error: 'Note introuvable' }, { status: 404 })

  const parsed = replySchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const reply = await prisma.coachNoteReply.create({
    data: {
      noteId:   params.noteId,
      // Keep memberId populated for compatibility with dev servers using an older Prisma Client.
      memberId: note.memberId,
      content:  parsed.data.content,
    },
    include: {
      member: { select: { name: true, image: true } },
    },
  })
  await attachReplyAuthor(reply.id, coachProfile!.userId, 'COACH')

  if (note.isSharedWithMember) {
    await prisma.notification.create({
      data: {
        coachId:         note.coachId,
        recipientUserId: note.memberId,
        type:            'MESSAGE',
        title:           'Réponse de votre coach sur une note',
        message:         `Votre coach a répondu à la note "${note.title}"`,
        relatedId:       note.id,
      },
    }).catch(() => {})
  }

  return NextResponse.json({ ...reply, authorUserId: coachProfile!.userId, authorRole: 'COACH' }, { status: 201 })
}

/** Deletes a specific reply (by replyId in body) from the note; verifies the note belongs to this coach. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { noteId: string } },
) {
  const { coachProfile, error } = await getCoachProfile()
  if (error) return error

  const { replyId } = await req.json()
  if (!replyId) return NextResponse.json({ error: 'replyId manquant' }, { status: 400 })

  const note = await prisma.coachNote.findFirst({
    where: { id: params.noteId, coachId: coachProfile!.id },
  })
  if (!note) return NextResponse.json({ error: 'Note introuvable' }, { status: 404 })

  await prisma.coachNoteReply.deleteMany({
    where: { id: replyId, noteId: params.noteId },
  })

  return NextResponse.json({ ok: true })
}
