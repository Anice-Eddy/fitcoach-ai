export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'

const noteSchema = z.object({
  memberId: z.string().min(1),
  title: z.string().min(2).max(120),
  content: z.string().min(2).max(5000),
  category: z.string().optional().nullable(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'DONE']).default('OPEN'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  tags: z.array(z.string().min(1).max(24)).max(8).default([]),
  followUpAt: z.string().datetime().optional().nullable(),
  isPinned: z.boolean().default(false),
  isSharedWithMember: z.boolean().default(false),
})

const updateNoteSchema = noteSchema.partial().extend({
  noteId: z.string().min(1),
})

async function getCoach() {
  const session = await auth()

  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  }

  const coach = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { coachProfile: true },
  })

  if (!coach?.coachProfile) {
    return { error: NextResponse.json({ error: 'Vous n\'êtes pas un coach' }, { status: 403 }) }
  }

  return { coach }
}

// GET: Récupérer les notes pour un membre
export async function GET(req: NextRequest) {
  try {
    const { coach, error } = await getCoach()
    if (error) return error

    const searchParams = req.nextUrl.searchParams
    const memberId = searchParams.get('memberId')
    const status = searchParams.get('status')

    if (!memberId) {
      return NextResponse.json(
        { error: 'memberId manquant' },
        { status: 400 }
      )
    }

    const notes = await prisma.coachNote.findMany({
      where: {
        coachId: coach!.coachProfile!.id,
        memberId,
        ...(status && status !== 'ALL' ? { status } : {}),
      },
      orderBy: [
        { isPinned: 'desc' },
        { followUpAt: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error('GET /api/coach/notes:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST: Créer une note pour un membre
export async function POST(req: NextRequest) {
  try {
    const { coach, error } = await getCoach()
    if (error) return error

    const parsed = noteSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const { memberId, title, content, category, status, priority, tags, followUpAt, isPinned, isSharedWithMember } = parsed.data

    const membership = await prisma.coachMember.findUnique({
      where: { coachId_memberId: { coachId: coach!.coachProfile!.id, memberId } },
    })
    if (!membership) {
      return NextResponse.json({ error: 'Ce membre n’est pas suivi par ce coach' }, { status: 403 })
    }

    const note = await prisma.coachNote.create({
      data: {
        coachId: coach!.coachProfile!.id,
        memberId,
        title,
        content,
        category,
        status,
        priority,
        tags,
        followUpAt: followUpAt ? new Date(followUpAt) : null,
        isPinned,
        isSharedWithMember,
      },
    })

    if (isSharedWithMember) {
      await prisma.notification.create({
        data: {
          coachId: coach!.coachProfile!.id,
          type: 'MESSAGE',
          title: `Nouvelle note: ${title}`,
          message: `Votre coach a partagé une note: ${title}`,
          relatedId: note.id,
        },
      })
    }

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('POST /api/coach/notes:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { coach, error } = await getCoach()
    if (error) return error

    const parsed = updateNoteSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const { noteId, followUpAt, ...data } = parsed.data
    const note = await prisma.coachNote.findFirst({
      where: { id: noteId, coachId: coach!.coachProfile!.id },
    })
    if (!note) return NextResponse.json({ error: 'Note introuvable' }, { status: 404 })

    const updated = await prisma.coachNote.update({
      where: { id: noteId },
      data: {
        ...data,
        ...(followUpAt !== undefined ? { followUpAt: followUpAt ? new Date(followUpAt) : null } : {}),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH /api/coach/notes:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { coach, error } = await getCoach()
    if (error) return error

    const { noteId } = await req.json()
    if (!noteId) return NextResponse.json({ error: 'noteId manquant' }, { status: 400 })

    const note = await prisma.coachNote.findFirst({
      where: { id: noteId, coachId: coach!.coachProfile!.id },
    })
    if (!note) return NextResponse.json({ error: 'Note introuvable' }, { status: 404 })

    await prisma.coachNote.delete({ where: { id: noteId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/coach/notes:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
