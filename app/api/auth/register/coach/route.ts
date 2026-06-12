export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma/client'
import { RATE_LIMITS, rateLimitByEmail, rateLimitByIp } from '@/lib/security/rate-limit'

const schema = z.object({
  name:            z.string().min(2, 'Le nom doit faire au moins 2 caractères'),
  email:           z.string().email('Email invalide'),
  password:        z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères'),
  bio:             z.string().min(20, 'La bio doit faire au moins 20 caractères').max(1000),
  specialties:     z.array(z.string()).min(1, 'Sélectionnez au moins une spécialité').max(5),
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
  discoveryCallTitle: z.string().min(2).max(80).default('Entretien découverte'),
  discoveryCallDuration: z.number().int().min(5).max(180).default(30),
  showDiscoveryCall: z.boolean().default(true),
})

/** Registers a new coach-only account with full profile data (bio, specialties, certifications, etc.); hashes the password and returns 201 on success. */
export async function POST(req: Request) {
  const limitedIp = await rateLimitByIp(req, 'auth:register-coach:ip', RATE_LIMITS.registerIp)
  if (!limitedIp.ok) return limitedIp.response

  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const limitedEmail = await rateLimitByEmail(parsed.data.email, 'auth:register-coach:email', RATE_LIMITS.registerEmail)
  if (!limitedEmail.ok) return limitedEmail.response

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

  const existing = await prisma.user.findUnique({
    where:  { email },
    select: { id: true, coachProfile: { select: { id: true } } },
  })

  if (existing) {
    const msg = existing.coachProfile
      ? 'Un compte coach existe déjà avec cet email. Connectez-vous directement.'
      : 'Cet email est déjà utilisé pour un compte membre. Connectez-vous pour créer un espace coach depuis votre profil.'
    return NextResponse.json({ error: { email: [msg] } }, { status: 409 })
  }

  const hashed = await hash(password, 12)

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      provider: 'EMAIL',
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
