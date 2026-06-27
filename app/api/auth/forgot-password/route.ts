export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma/client'

const schema = z.object({
  email: z.string().email(),
  intent: z.enum(['firebase', 'legacy']).optional(),
})

/** Validates that a Firebase password reset can be requested for this BodyOps account. */
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
    return NextResponse.json({ ok: true, method: 'firebase-client-email' })
  }

  return NextResponse.json(
    {
      ok: false,
      reason: 'FIREBASE_ONLY',
      message: 'La réinitialisation du mot de passe est maintenant gérée par Firebase.',
    },
    { status: 410 },
  )
}
