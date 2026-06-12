export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma/client'
import { RATE_LIMITS, rateLimitByEmail, rateLimitByIp } from '@/lib/security/rate-limit'

const registerSchema = z.object({
  name:              z.string().min(2, 'Le nom doit faire au moins 2 caractères'),
  email:             z.string().trim().toLowerCase().email('Email invalide'),
  password:          z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères'),
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
  discoveryCallTitle: z.string().min(2).max(80).default('Entretien découverte'),
  discoveryCallDuration: z.number().int().min(5).max(180).default(30),
  showDiscoveryCall: z.boolean().default(true),
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
  const limitedIp = await rateLimitByIp(req, 'auth:register:ip', RATE_LIMITS.registerIp)
  if (!limitedIp.ok) return limitedIp.response

  const body   = await req.json()
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const limitedEmail = await rateLimitByEmail(parsed.data.email, 'auth:register:email', RATE_LIMITS.registerEmail)
  if (!limitedEmail.ok) return limitedEmail.response

  const { name, email, password, accountType } = parsed.data
  const isCoach = accountType === 'COACH'

  if (isCoach) {
    const coachErrors: Record<string, string[]> = {}
    if (!parsed.data.bio || parsed.data.bio.trim().length < 30) {
      coachErrors.bio = ['Présentez votre approche coach en au moins 30 caractères']
    }
    if (splitList(parsed.data.specialties).length === 0) {
      coachErrors.specialties = ['Ajoutez au moins une spécialité']
    }
    if (splitList(parsed.data.certifications).length === 0) {
      coachErrors.certifications = ['Ajoutez au moins une certification']
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
        error: { email: [`Cet email est déjà associé à un compte ${providerLabel}. Connectez-vous via ${providerLabel} — les deux méthodes de connexion seront liées automatiquement.`] },
      }, { status: 409 })
    }
    const msg = existing.coachProfile
      ? 'Un compte avec cet email existe déjà. Connectez-vous pour accéder à votre espace coach ou membre.'
      : 'Cet email est déjà utilisé. Connectez-vous pour accéder à votre compte.'
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
