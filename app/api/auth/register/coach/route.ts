export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma/client'
import { isLegalAcceptanceComplete, userLegalAcceptanceData } from '@/lib/legal/consent'
import { optionalLegalAcceptanceSchema } from '@/lib/legal/validation'

const schema = z.object({
  name:            z.string().min(2, 'Name must be at least 2 characters'),
  email:           z.string().email('Invalid email'),
  password:        z.string().min(8, 'Password must be at least 8 characters'),
  bio:             z.string().min(20, 'Bio must be at least 20 characters').max(1000),
  specialties:     z.array(z.string()).min(1, 'Select at least one specialty').max(5),
  certifications:  z.array(z.string()).default([]),
  yearsExperience: z.number().int().min(0).max(50).optional(),
  city:            z.string().max(100).optional(),
  phone:           z.string().max(20).optional(),
  memberLimit:     z.number().int().min(1).max(100).default(10),
  showMemberCount: z.boolean().default(true),
  showYearsExperience: z.boolean().default(true),
  publicRating:    z.number().min(0).max(5).nullable().optional(),
  publicRatingCount: z.number().int().min(0).max(100000).default(0),
  showPublicRating: z.boolean().default(false),
  discoveryCallEnabled: z.boolean().default(true),
  discoveryCallTitle: z.string().min(2).max(80).default('Discovery call'),
  discoveryCallDuration: z.number().int().min(5).max(180).default(30),
  showDiscoveryCall: z.boolean().default(true),
  legalAcceptance: optionalLegalAcceptanceSchema,
})

/** Registers a new coach-only account with full profile data (bio, specialties, certifications, etc.); hashes the password and returns 201 on success. */
export async function POST(req: Request) {

  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  if (!isLegalAcceptanceComplete(parsed.data.legalAcceptance)) {
    return NextResponse.json({
      error: { legal: ['Terms and privacy policy acceptance is required.'] },
    }, { status: 422 })
  }

  const {
    name,
    email,
    password,
    bio,
    specialties,
    certifications,
    yearsExperience,
    city,
    phone,
    memberLimit,
    showMemberCount,
    showYearsExperience,
    publicRating,
    publicRatingCount,
    showPublicRating,
    discoveryCallEnabled,
    discoveryCallTitle,
    discoveryCallDuration,
    showDiscoveryCall,
  } = parsed.data
  const legalAcceptance = userLegalAcceptanceData(parsed.data.legalAcceptance)

  const existing = await prisma.user.findUnique({
    where:  { email },
    select: { id: true, coachProfile: { select: { id: true } } },
  })

  if (existing) {
    const msg = existing.coachProfile
      ? 'A coach account already exists with this email. Sign in directly.'
      : 'This email is already used by a member account. Sign in to create a coach space from your profile.'
    return NextResponse.json({ error: { email: [msg] } }, { status: 409 })
  }

  const hashed = await hash(password, 12)

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      provider: 'EMAIL',
      ...(legalAcceptance ?? {}),
      coachProfile: {
        create: {
          bio,
          specialties,
          certifications,
          yearsExperience,
          city:        city ?? null,
          phone:       phone ?? null,
          memberLimit,
          showMemberCount,
          showYearsExperience,
          publicRating: publicRating ?? null,
          publicRatingCount,
          showPublicRating,
          discoveryCallEnabled,
          discoveryCallTitle: discoveryCallTitle.trim(),
          discoveryCallDuration,
          showDiscoveryCall,
          isVerified:  false,
        },
      },
    },
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
