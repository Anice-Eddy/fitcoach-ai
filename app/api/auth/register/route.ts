export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma/client'

const registerSchema = z.object({
  name:     z.string().min(2, 'Le nom doit faire au moins 2 caractères'),
  email:    z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères'),
})

export async function POST(req: Request) {
  const body   = await req.json()
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const { name, email, password } = parsed.data

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, coachProfile: { select: { id: true } } },
  })
  if (existing) {
    const msg = existing.coachProfile
      ? 'Un compte avec cet email existe déjà. Connectez-vous pour accéder à votre espace coach ou membre.'
      : 'Cet email est déjà utilisé. Connectez-vous pour accéder à votre compte.'
    return NextResponse.json({ error: { email: [msg] } }, { status: 409 })
  }

  const hashed = await hash(password, 12)

  await prisma.user.create({
    data: { name, email, password: hashed, provider: 'EMAIL' },
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
