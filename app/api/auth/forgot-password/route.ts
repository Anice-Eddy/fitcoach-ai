export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma/client'
import { sendPasswordResetEmail } from '@/lib/email/send'

const schema = z.object({ email: z.string().email() })

export async function POST(req: Request) {
  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 422 })
  }

  const { email } = parsed.data

  // Toujours renvoyer succès pour ne pas révéler si l'email existe
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return NextResponse.json({ ok: true })
  }

  // Supprimer les anciens tokens de cet utilisateur
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

  // Créer un token sécurisé valide 1h
  const token     = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  })

  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const resetUrl = `${appUrl}/auth/reset-password?token=${token}`

  await sendPasswordResetEmail(email, resetUrl)

  return NextResponse.json({ ok: true })
}
