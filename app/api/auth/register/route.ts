export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { compare, hash } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma/client'

const registerSchema = z.object({
  name:              z.string().min(2, 'Le nom doit faire au moins 2 caractères'),
  email:             z.string().email('Email invalide'),
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
})

function splitList(value?: string) {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export async function POST(req: Request) {
  const body   = await req.json()
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

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
    where: { email },
    select: { id: true, password: true, coachProfile: { select: { id: true } } },
  })
  if (existing) {
    if (!isCoach) {
      return NextResponse.json({ error: { email: ['Cet email est déjà utilisé. Connectez-vous pour accéder à votre compte.'] } }, { status: 409 })
    }

    if (existing.coachProfile) {
      return NextResponse.json({ error: { email: ['Un espace coach existe déjà avec cet email. Connectez-vous pour accéder à votre tableau de bord coach.'] } }, { status: 409 })
    }

    if (!existing.password) {
      return NextResponse.json({
        error: {
          email: ['Ce compte existe déjà avec Google. Connectez-vous avec Google depuis la page coach pour créer votre espace coach.'],
        },
      }, { status: 409 })
    }

    const validPassword = await compare(password, existing.password)
    if (!validPassword) {
      return NextResponse.json({
        error: {
          password: ['Entrez le mot de passe de votre compte client pour ajouter l’espace coach à cette adresse email.'],
        },
      }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: existing.id },
      data: {
        subscriptionPlan: 'BUSINESS',
        coachProfile: {
          create: {
            bio:             parsed.data.bio?.trim(),
            specialties:     splitList(parsed.data.specialties),
            certifications:  splitList(parsed.data.certifications),
            yearsExperience: parsed.data.yearsExperience ?? null,
            city:            parsed.data.city?.trim() || null,
            phone:           parsed.data.phone?.trim() || null,
          },
        },
      },
    })

    return NextResponse.json({ success: true }, { status: 200 })
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
              },
            },
          }
        : {}),
    },
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
