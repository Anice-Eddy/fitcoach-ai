export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/** Returns coach notes shared with the authenticated member, including coach info and replies. */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const notes = await prisma.coachNote.findMany({
    where: { memberId: session.user.id, isSharedWithMember: true },
    include: {
      coachProfile: {
        include: { user: { select: { name: true, image: true } } },
      },
      replies: {
        include: { member: { select: { name: true, image: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(
    notes.map(n => ({
      id:          n.id,
      title:       n.title,
      content:     n.content,
      category:    n.category,
      tags:        n.tags,
      isPinned:    n.isPinned,
      isImportant: n.isImportant,
      createdAt:   n.createdAt.toISOString(),
      coachName:   n.coachProfile.user.name ?? 'Votre coach',
      replies:     n.replies.map(r => ({
        id:        r.id,
        content:   r.content,
        memberId:  r.memberId,
        memberName: r.member.name ?? 'Membre',
        createdAt: r.createdAt.toISOString(),
      })),
    })),
  )
}

/** Hides a shared coach note from the member by unsetting isSharedWithMember; blocked for notes marked isImportant by the coach. */
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { noteId } = await req.json()
  if (!noteId) return NextResponse.json({ error: 'noteId manquant' }, { status: 400 })

  const note = await prisma.coachNote.findFirst({
    where: { id: noteId, memberId: session.user.id, isSharedWithMember: true },
  })
  if (!note) return NextResponse.json({ error: 'Note introuvable' }, { status: 404 })

  if (note.isImportant) {
    return NextResponse.json(
      { error: 'Cette note a été marquée comme importante par votre coach et ne peut pas être supprimée.' },
      { status: 403 },
    )
  }

  // Remove sharing instead of deleting the note (coach keeps the note)
  await prisma.coachNote.update({
    where: { id: noteId },
    data:  { isSharedWithMember: false },
  })

  return NextResponse.json({ ok: true })
}
