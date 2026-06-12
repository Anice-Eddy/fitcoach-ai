export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { RATE_LIMITS, rateLimitByUserId } from '@/lib/security/rate-limit'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'

const schema = z.object({
  bio:             z.string().optional(),
  specialties:     z.array(z.string()).optional(),
  certifications:  z.array(z.string()).optional(),
  yearsExperience: z.coerce.number().int().min(0).max(60).nullable().optional(),
  city:            z.string().max(100).nullable().optional(),
  country:         z.string().max(100).nullable().optional(),
  phone:           z.string().nullable().optional(),
  memberLimit:     z.coerce.number().int().min(1).max(500).optional(),
  avatarUrl:       z.string().url().nullable().optional(),
  showMemberCount: z.boolean().optional(),
  showYearsExperience: z.boolean().optional(),
  publicRating:    z.coerce.number().min(0).max(5).nullable().optional(),
  publicRatingCount: z.coerce.number().int().min(0).max(100000).optional(),
  showPublicRating: z.boolean().optional(),
  discoveryCallEnabled: z.boolean().optional(),
  discoveryCallTitle: z.string().min(2).max(80).optional(),
  discoveryCallDuration: z.coerce.number().int().min(5).max(180).optional(),
  showDiscoveryCall: z.boolean().optional(),
})

/** Updates coach profile settings (bio, specialties, certifications, memberLimit, avatarUrl, etc.); ignores undefined fields. */
export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const limited = await rateLimitByUserId(session.user.id, 'coach:settings', RATE_LIMITS.coach)
  if (!limited.ok) return limited.response

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const coachProfile = await prisma.coachProfile.findUnique({
    where: { userId: session.user.id },
  })
  if (!coachProfile) return NextResponse.json({ error: 'Profil coach introuvable' }, { status: 404 })

  const d = parsed.data
  const updated = await prisma.coachProfile.update({
    where: { id: coachProfile.id },
    data: {
      ...(d.bio             !== undefined && { bio: d.bio }),
      ...(d.specialties     !== undefined && { specialties: d.specialties }),
      ...(d.certifications  !== undefined && { certifications: d.certifications }),
      ...(d.yearsExperience !== undefined && { yearsExperience: d.yearsExperience }),
      ...(d.city            !== undefined && { city:    d.city }),
      ...(d.country         !== undefined && { country: d.country }),
      ...(d.phone           !== undefined && { phone:   d.phone }),
      ...(d.memberLimit     !== undefined && { memberLimit: d.memberLimit }),
      ...(d.avatarUrl       !== undefined && { avatarUrl: d.avatarUrl }),
      ...(d.showMemberCount !== undefined && { showMemberCount: d.showMemberCount }),
      ...(d.showYearsExperience !== undefined && { showYearsExperience: d.showYearsExperience }),
      ...(d.publicRating    !== undefined && { publicRating: d.publicRating }),
      ...(d.publicRatingCount !== undefined && { publicRatingCount: d.publicRatingCount }),
      ...(d.showPublicRating !== undefined && { showPublicRating: d.showPublicRating }),
      ...(d.discoveryCallEnabled !== undefined && { discoveryCallEnabled: d.discoveryCallEnabled }),
      ...(d.discoveryCallTitle !== undefined && { discoveryCallTitle: d.discoveryCallTitle.trim() }),
      ...(d.discoveryCallDuration !== undefined && { discoveryCallDuration: d.discoveryCallDuration }),
      ...(d.showDiscoveryCall !== undefined && { showDiscoveryCall: d.showDiscoveryCall }),
    },
  })

  return NextResponse.json(updated)
}
