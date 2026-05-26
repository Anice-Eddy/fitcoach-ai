import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// GET: Récupérer les membres du coach
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer le coach et ses membres
    const coach = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        coachProfile: {
          include: {
            coachMembers: {
              include: {
                member: {
                  include: {
                    profile: true,
                    bodyMetrics: {
                      orderBy: { date: 'desc' },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!coach?.coachProfile) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas un coach' },
        { status: 403 }
      )
    }

    return NextResponse.json(coach.coachProfile.coachMembers)
  } catch (error) {
    console.error('GET /api/coach/members:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST: Ajouter un membre au coach
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { memberId } = await req.json()

    if (!memberId) {
      return NextResponse.json(
        { error: 'memberId manquant' },
        { status: 400 }
      )
    }

    // Vérifier que le coach existe
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

    // Ajouter le membre
    const coachMember = await prisma.coachMember.create({
      data: {
        coachId: coach.coachProfile.id,
        memberId,
      },
      include: {
        member: {
          include: { profile: true },
        },
      },
    })

    // Créer une notification
    await prisma.notification.create({
      data: {
        coachId: coach.coachProfile.id,
        type: 'NEW_MEMBER',
        title: `Nouveau membre: ${coachMember.member.name}`,
        message: `${coachMember.member.name} a été ajouté à vos membres suivis.`,
        relatedId: memberId,
      },
    })

    return NextResponse.json(coachMember, { status: 201 })
  } catch (error) {
    console.error('POST /api/coach/members:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
