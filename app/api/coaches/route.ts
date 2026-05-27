export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma/client'
import { NextResponse } from 'next/server'

/** Returns a public list of all coaches with their profile summary (bio, specialties, verification status, member count). */
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
