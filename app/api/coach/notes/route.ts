export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// GET: Récupérer les notes pour un membre
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const memberId = searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json(
        { error: 'memberId manquant' },
        { status: 400 }
      )
    }

    const coach = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { coachProfile: true },
    })

    if (!coach?.coachProfile) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas un coach' },
        { status: 403 }
      )
    }

    const notes = await prisma.coachNote.findMany({
      where: {
        coachId: coach.coachProfile.id,
        memberId,
      },
      orderBy: { createdAt: 'desc' },
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
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { memberId, title, content, category } = await req.json()

    if (!memberId || !title || !content) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    const coach = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { coachProfile: true },
    })

    if (!coach?.coachProfile) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas un coach' },
        { status: 403 }
      )
    }

    const note = await prisma.coachNote.create({
      data: {
        coachId: coach.coachProfile.id,
        memberId,
        title,
        content,
        category,
      },
    })

    // Créer une notification
    const member = await prisma.user.findUnique({
      where: { id: memberId },
    })

    await prisma.notification.create({
      data: {
        coachId: coach.coachProfile.id,
        type: 'MESSAGE',
        title: `Nouvelle note: ${title}`,
        message: `Votre coach a écrit une note: ${title}`,
        relatedId: note.id,
      },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('POST /api/coach/notes:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
