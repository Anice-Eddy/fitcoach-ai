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
          showMemberCount: true,
          showYearsExperience: true,
          publicRating: true,
          publicRatingCount: true,
          showPublicRating: true,
          discoveryCallEnabled: true,
          discoveryCallTitle: true,
          discoveryCallDuration: true,
          showDiscoveryCall: true,
          _count: { select: { coachMembers: true, appointments: true } },
        },
      },
    },
  })

  if (!coach?.coachProfile) {
    return NextResponse.json({ error: 'Coach not found' }, { status: 404 })
  }

  const profile = coach.coachProfile
  // Public profile details follow the coach's visibility settings at API level.
  return NextResponse.json({
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
        appointments: profile._count.appointments,
      },
    },
  })
}
