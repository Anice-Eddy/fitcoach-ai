export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NextRequest, NextResponse } from 'next/server'

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

// GET: all replies for a note (coach view)
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

  const replies = await prisma.coachNoteReply.findMany({
    where: { noteId: params.noteId },
    include: { member: { select: { name: true, image: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(replies)
}

// DELETE: coach removes a reply
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
