export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'

const schema = z.object({
  bio:             z.string().optional(),
  specialties:     z.array(z.string()).optional(),
  certifications:  z.array(z.string()).optional(),
  yearsExperience: z.number().int().min(0).max(60).nullable().optional(),
  city:            z.string().nullable().optional(),
  phone:           z.string().nullable().optional(),
  memberLimit:     z.number().int().min(1).max(500).optional(),
  avatarUrl:       z.string().url().nullable().optional(),
})

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

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
      ...(d.city            !== undefined && { city: d.city }),
      ...(d.phone           !== undefined && { phone: d.phone }),
      ...(d.memberLimit     !== undefined && { memberLimit: d.memberLimit }),
      ...(d.avatarUrl       !== undefined && { avatarUrl: d.avatarUrl }),
    },
  })

  return NextResponse.json(updated)
}
