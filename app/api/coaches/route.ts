export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma/client'
import { NextResponse } from 'next/server'

// GET: public list of coaches
export async function GET() {
  const coaches = await prisma.user.findMany({
    where: { coachProfile: { isNot: null } },
    select: {
      id: true,
      name: true,
      image: true,
      coachProfile: {
        select: {
          id: true,
          bio: true,
          specialties: true,
          isVerified: true,
          _count: { select: { coachMembers: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(coaches)
}
