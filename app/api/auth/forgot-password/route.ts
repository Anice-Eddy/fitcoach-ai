export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma/client'
import { sendPasswordResetEmail } from '@/lib/email/send'

const schema = z.object({
  email: z.string().email(),
  intent: z.enum(['firebase', 'legacy']).optional(),
})

/** Initiates a password reset for the given email: creates a 1-hour token and sends a reset email; returns errors for unknown email or OAuth-only accounts. */
export async function POST(req: Request) {

  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 422 })
  }

  const { email, intent } = parsed.data

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, password: true, provider: true, authProvider: true },
  })

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        reason: 'EMAIL_NOT_FOUND',
        message: "Aucun compte n'existe avec cette adresse email.",
      },
      { status: 404 },
    )
  }

  const socialProvider = user.provider === 'GOOGLE'
    ? 'Google'
    : user.provider === 'FACEBOOK'
      ? 'Facebook'
      : user.authProvider === 'APPLE'
        ? 'Apple'
        : null

  if (socialProvider) {
    return NextResponse.json(
      {
        ok: false,
        reason: 'SOCIAL_PROVIDER',
        provider: socialProvider,
        message: `Vous êtes connecté avec ${socialProvider}. Veuillez modifier votre mot de passe depuis votre compte ${socialProvider}.`,
      },
      { status: 409 },
    )
  }

  if (intent === 'firebase') {
    return NextResponse.json({ ok: true, method: 'firebase' })
  }

  if (!user.password) {
    const provider = user.provider === 'GOOGLE'
      ? 'Google'
      : user.provider === 'FACEBOOK'
        ? 'Facebook'
        : 'un fournisseur externe'
    return NextResponse.json(
      {
        ok: false,
        reason: 'NO_PASSWORD',
        message: `Ce compte utilise ${provider}. Connectez-vous avec ${provider}, aucun mot de passe BodyOps n'est configuré.`,
      },
      { status: 409 },
    )
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

  try {
    await sendPasswordResetEmail(email, resetUrl)
  } catch (error) {
    console.error('[forgot-password] email delivery failed:', error)
    return NextResponse.json(
      {
        ok: false,
        reason: 'EMAIL_DELIVERY_FAILED',
        message: "L'email n'a pas pu être envoyé. Vérifie la configuration du service d'email.",
      },
      { status: 503 },
    )
  }

  return NextResponse.json({ ok: true })
}
