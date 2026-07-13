export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { getNormalizedCoachNoteReplies } from '@/lib/notes/replies'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/** Returns coach notes shared with the authenticated member, including coach info and replies. */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const [profile, notes] = await Promise.all([
    prisma.profile.findUnique({
      where:  { userId: session.user.id },
      select: { language: true },
    }),
    prisma.coachNote.findMany({
      where: { memberId: session.user.id, isSharedWithMember: true },
      include: {
        coachProfile: {
          include: { user: { select: { name: true, image: true } } },
        },
        replies: {
          include: {
            member: { select: { name: true, image: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    }),
  ])
  const isEnglish = profile?.language === 'en'
  const fallbackCoachName = isEnglish ? 'Your coach' : 'Votre coach'
  const fallbackMemberName = isEnglish ? 'Member' : 'Membre'

  const repliesByNoteId = new Map<string, Awaited<ReturnType<typeof getNormalizedCoachNoteReplies>>>()
  await Promise.all(notes.map(async (note) => {
    repliesByNoteId.set(note.id, await getNormalizedCoachNoteReplies(note.id))
  }))

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
      coachName:   n.coachProfile.user.name ?? fallbackCoachName,
      replies:     (repliesByNoteId.get(n.id) ?? []).map(r => ({
        id:        r.id,
        content:   r.content,
        memberId:  r.memberId,
        authorRole: r.authorRole,
        authorName: r.authorRole === 'COACH' ? 'Coach' : r.member?.name ?? fallbackMemberName,
        createdAt: r.createdAt.toISOString(),
      })),
    })),
  )
}

/** Hides a shared coach note from the member by unsetting isSharedWithMember; blocked for notes marked isImportant by the coach. */
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { noteId } = await req.json()
  if (!noteId) return NextResponse.json({ error: 'Missing noteId' }, { status: 400 })

  const note = await prisma.coachNote.findFirst({
    where: { id: noteId, memberId: session.user.id, isSharedWithMember: true },
  })
  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

  if (note.isImportant) {
    return NextResponse.json(
      { error: 'This note was marked as important by your coach and cannot be removed.' },
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
