export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma/client'
import { verifyFirebaseToken } from '@/lib/firebase/verify-token'
import { findOrCreateUserFromFirebase } from '@/lib/firebase/users'

const bodySchema = z.object({
  firebaseToken: z.string().min(20),
  provider: z.enum(['google', 'facebook']),
})

function firebaseProviderMatches(requestedProvider: 'google' | 'facebook', signInProvider?: string) {
  return requestedProvider === 'google'
    ? signInProvider === 'google.com'
    : signInProvider === 'facebook.com'
}

function hasFirebaseAdminConfig() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) return true

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY
  return Boolean(projectId && clientEmail && privateKey)
}

/** Verifies a Firebase social token, links the BodyOps user, and returns a short-lived NextAuth handoff token. */
export async function POST(req: NextRequest) {

  if (!hasFirebaseAdminConfig()) {
    return NextResponse.json({
      error: 'Firebase Admin n’est pas configuré côté serveur. Ajoute la clé privée du service account Firebase dans le fichier .env.',
    }, { status: 503 })
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 422 })
  }

  try {
    const decoded = await verifyFirebaseToken(parsed.data.firebaseToken)
    if (!decoded || !firebaseProviderMatches(parsed.data.provider, decoded.firebase?.sign_in_provider)) {
      return NextResponse.json({ error: 'Connexion invalide ou expirée.' }, { status: 401 })
    }

    const user = await findOrCreateUserFromFirebase(decoded)
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await prisma.authHandoffToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    })

    return NextResponse.json({
      firebaseSessionToken: token,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        isCoach: Boolean(user.coachProfile),
        hasMemberProfile: Boolean(user.profile),
      },
    })
  } catch (error) {
    console.error('[firebase-signin] unexpected error:', error)
    return NextResponse.json({ error: 'Connexion Firebase impossible côté serveur.' }, { status: 500 })
  }
}
