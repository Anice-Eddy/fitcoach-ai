export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma/client'

const schema = z.object({
  token:    z.string().min(1),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
})

/** Validates a password-reset token, updates the user's hashed password, and deletes the used token; returns 400 on invalid or expired token. */
export async function POST(req: Request) {

  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 422 },
    )
  }

  const { token, password } = parsed.data

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  })

  if (!resetToken) {
    return NextResponse.json({ error: 'Lien invalide ou déjà utilisé' }, { status: 400 })
  }

  if (resetToken.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { token } })
    return NextResponse.json({ error: 'Lien expiré — demande un nouveau lien' }, { status: 400 })
  }

  const hashed = await hash(password, 12)

  await prisma.user.update({
    where: { id: resetToken.userId },
    data:  { password: hashed },
  })

  await prisma.passwordResetToken.delete({ where: { token } })

  return NextResponse.json({ ok: true })
}
