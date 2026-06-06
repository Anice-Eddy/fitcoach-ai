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
          id:             true,
          bio:            true,
          specialties:    true,
          isVerified:     true,
          city:           true,
          country:        true,
          yearsExperience: true,
          showMemberCount: true,
          showYearsExperience: true,
          publicRating: true,
          publicRatingCount: true,
          showPublicRating: true,
          discoveryCallEnabled: true,
          discoveryCallTitle: true,
          discoveryCallDuration: true,
          showDiscoveryCall: true,
          _count: { select: { coachMembers: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Public responses must not leak values the coach decided to hide.
  const visibleCoaches = coaches.map((coach) => {
    const profile = coach.coachProfile
    if (!profile) return coach

    return {
      ...coach,
      coachProfile: {
        ...profile,
        yearsExperience: profile.showYearsExperience ? profile.yearsExperience : null,
        publicRating: profile.showPublicRating ? profile.publicRating : null,
        publicRatingCount: profile.showPublicRating ? profile.publicRatingCount : 0,
        discoveryCallTitle: profile.showDiscoveryCall && profile.discoveryCallEnabled ? profile.discoveryCallTitle : null,
        discoveryCallDuration: profile.showDiscoveryCall && profile.discoveryCallEnabled ? profile.discoveryCallDuration : null,
        _count: {
          coachMembers: profile.showMemberCount ? profile._count.coachMembers : null,
        },
      },
    }
  })

  return NextResponse.json(visibleCoaches)
}
