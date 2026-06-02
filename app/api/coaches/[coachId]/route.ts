export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma/client'
import { NextRequest, NextResponse } from 'next/server'

/** Returns a single coach's public profile detail by User.id, including member and appointment counts; 404 if not a coach. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { coachId: string } },
) {
  const coach = await prisma.user.findUnique({
    where: { id: params.coachId },
    select: {
      id: true,
      name: true,
      image: true,
      coachProfile: {
        select: {
          id:              true,
          bio:             true,
          specialties:     true,
          certifications:  true,
          isVerified:      true,
          city:            true,
          country:         true,
          yearsExperience: true,
          avatarUrl:       true,
          _count: { select: { coachMembers: true, appointments: true } },
        },
      },
    },
  })

  if (!coach?.coachProfile) {
    return NextResponse.json({ error: 'Coach introuvable' }, { status: 404 })
  }

  return NextResponse.json(coach)
}
