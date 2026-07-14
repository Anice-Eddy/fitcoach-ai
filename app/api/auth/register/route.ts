export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma/client'
import { isLegalAcceptanceComplete, userLegalAcceptanceData } from '@/lib/legal/consent'
import { optionalLegalAcceptanceSchema } from '@/lib/legal/validation'

const registerSchema = z.object({
  name:              z.string().min(2, 'Name must be at least 2 characters'),
  email:             z.string().trim().toLowerCase().email('Invalid email'),
  password:          z.string().min(8, 'Password must be at least 8 characters'),
  accountType:       z.enum(['MEMBER', 'COACH']).default('MEMBER'),
  bio:               z.string().optional(),
  specialties:       z.string().optional(),
  certifications:    z.string().optional(),
  yearsExperience:   z.preprocess(
    (value) => value === '' || value === undefined ? undefined : Number(value),
    z.number().int().min(0).max(60).optional(),
  ),
  city:              z.string().optional(),
  phone:             z.string().optional(),
  showMemberCount:   z.boolean().default(true),
  showYearsExperience: z.boolean().default(true),
  publicRating:      z.number().min(0).max(5).nullable().optional(),
  publicRatingCount: z.number().int().min(0).max(100000).default(0),
  showPublicRating:  z.boolean().default(false),
  discoveryCallEnabled: z.boolean().default(true),
  discoveryCallTitle: z.string().min(2).max(80).default('Discovery call'),
  discoveryCallDuration: z.number().int().min(5).max(180).default(30),
  showDiscoveryCall: z.boolean().default(true),
  legalAcceptance: optionalLegalAcceptanceSchema,
})

// Splits a comma-separated string into a trimmed, non-empty string array.
function splitList(value?: string) {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

/** Registers a new member or coach account; validates extra coach fields, rejects duplicate emails, hashes the password, and persists the new user with optional coach profile. */
export async function POST(req: Request) {

  const body   = await req.json()
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  if (!isLegalAcceptanceComplete(parsed.data.legalAcceptance)) {
    return NextResponse.json({
      error: { legal: ['Terms and privacy policy acceptance is required.'] },
    }, { status: 422 })
  }

  const { name, email, password, accountType } = parsed.data
  const isCoach = accountType === 'COACH'
  const legalAcceptance = userLegalAcceptanceData(parsed.data.legalAcceptance)

  if (isCoach) {
    const coachErrors: Record<string, string[]> = {}
    if (!parsed.data.bio || parsed.data.bio.trim().length < 30) {
      coachErrors.bio = ['Describe your coaching approach in at least 30 characters']
    }
    if (splitList(parsed.data.specialties).length === 0) {
      coachErrors.specialties = ['Add at least one specialty']
    }
    if (splitList(parsed.data.certifications).length === 0) {
      coachErrors.certifications = ['Add at least one certification']
    }
    if (Object.keys(coachErrors).length > 0) {
      return NextResponse.json({ error: coachErrors }, { status: 422 })
    }
  }

  const existing = await prisma.user.findUnique({
    where:  { email },
    select: { id: true, password: true, provider: true, coachProfile: { select: { id: true } } },
  })
  if (existing) {
    if (!existing.password && (existing.provider === 'GOOGLE' || existing.provider === 'FACEBOOK')) {
      const providerLabel = existing.provider === 'GOOGLE' ? 'Google' : 'Facebook'
      return NextResponse.json({
        error: { email: [`This email is already linked to a ${providerLabel}. Sign in with ${providerLabel} - both sign-in methods will be linked automatically.`] },
      }, { status: 409 })
    }
    const msg = existing.coachProfile
      ? 'An account with this email already exists. Sign in to access your coach or member space.'
      : 'This email is already in use. Sign in to access your account.'
    return NextResponse.json({ error: { email: [msg] } }, { status: 409 })
  }

  const hashed = await hash(password, 12)

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      provider: 'EMAIL',
      subscriptionPlan: isCoach ? 'BUSINESS' : 'FREE',
      ...(legalAcceptance ?? {}),
      ...(isCoach
        ? {
            coachProfile: {
              create: {
                bio:             parsed.data.bio?.trim(),
                specialties:     splitList(parsed.data.specialties),
                certifications:  splitList(parsed.data.certifications),
                yearsExperience: parsed.data.yearsExperience ?? null,
                city:            parsed.data.city?.trim() || null,
                phone:           parsed.data.phone?.trim() || null,
                showMemberCount: parsed.data.showMemberCount,
                showYearsExperience: parsed.data.showYearsExperience,
                publicRating:    parsed.data.publicRating ?? null,
                publicRatingCount: parsed.data.publicRatingCount,
                showPublicRating: parsed.data.showPublicRating,
                discoveryCallEnabled: parsed.data.discoveryCallEnabled,
                discoveryCallTitle: parsed.data.discoveryCallTitle.trim(),
                discoveryCallDuration: parsed.data.discoveryCallDuration,
                showDiscoveryCall: parsed.data.showDiscoveryCall,
              },
            },
          }
        : {}),
    },
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
