export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma/client'

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
})

export async function POST(req: Request) {
  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const { name, email, password, bio, specialties, certifications, yearsExperience, city, phone, memberLimit } = parsed.data

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
          isVerified:  false,
        },
      },
    },
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
