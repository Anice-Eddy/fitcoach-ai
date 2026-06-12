import type { DecodedIdToken } from 'firebase-admin/auth'
import { prisma } from '@/lib/prisma/client'

type FirebaseBodyOpsProvider = 'EMAIL' | 'GOOGLE' | 'FACEBOOK' | 'PASSWORD' | 'UNKNOWN'

function normalizeEmail(email?: string) {
  return email?.trim().toLowerCase() || null
}

function firebaseProviderFromToken(token: DecodedIdToken): FirebaseBodyOpsProvider {
  const provider = token.firebase?.sign_in_provider
  if (provider === 'google.com') return 'GOOGLE'
  if (provider === 'facebook.com') return 'FACEBOOK'
  if (provider === 'password') return 'PASSWORD'
  if (provider === 'emailLink') return 'EMAIL'
  return 'UNKNOWN'
}

function legacyProvider(provider: FirebaseBodyOpsProvider) {
  if (provider === 'GOOGLE') return 'GOOGLE' as const
  if (provider === 'FACEBOOK') return 'FACEBOOK' as const
  return 'EMAIL' as const
}

function nextAuthProvider(provider: FirebaseBodyOpsProvider) {
  if (provider === 'GOOGLE') return 'google'
  if (provider === 'FACEBOOK') return 'facebook'
  return null
}

async function linkSocialAccount(userId: string, decoded: DecodedIdToken, provider: FirebaseBodyOpsProvider) {
  const accountProvider = nextAuthProvider(provider)
  if (!accountProvider) return

  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: accountProvider,
        providerAccountId: decoded.uid,
      },
    },
    update: { userId },
    create: {
      userId,
      type: 'oauth',
      provider: accountProvider,
      providerAccountId: decoded.uid,
    },
  })
}

/** Finds or creates the BodyOps user linked to a verified Firebase identity. */
export async function findOrCreateUserFromFirebase(decoded: DecodedIdToken) {
  const email = normalizeEmail(decoded.email)
  const now = new Date()
  const authProvider = firebaseProviderFromToken(decoded)

  if (!email) {
    throw new Error('Firebase token does not contain an email.')
  }

  const byUid = await prisma.user.findUnique({
    where: { firebaseUid: decoded.uid },
    include: { profile: { select: { id: true } }, coachProfile: { select: { id: true } } },
  })

  if (byUid) {
    const user = await prisma.user.update({
      where: { id: byUid.id },
      data: {
        email,
        name: decoded.name ?? byUid.name,
        image: decoded.picture ?? byUid.image,
        authProvider,
        firebaseEmailVerified: decoded.email_verified === true,
        lastLoginAt: now,
      },
      include: { profile: { select: { id: true } }, coachProfile: { select: { id: true } } },
    })
    await linkSocialAccount(user.id, decoded, authProvider)
    return user
  }

  const byEmail = await prisma.user.findUnique({
    where: { email },
    include: { profile: { select: { id: true } }, coachProfile: { select: { id: true } } },
  })

  if (byEmail) {
    const user = await prisma.user.update({
      where: { id: byEmail.id },
      data: {
        firebaseUid: decoded.uid,
        authProvider,
        firebaseEmailVerified: decoded.email_verified === true,
        lastLoginAt: now,
        authMigratedAt: byEmail.authMigratedAt ?? now,
        name: decoded.name ?? byEmail.name,
        image: decoded.picture ?? byEmail.image,
        provider: legacyProvider(authProvider),
      },
      include: { profile: { select: { id: true } }, coachProfile: { select: { id: true } } },
    })
    await linkSocialAccount(user.id, decoded, authProvider)
    return user
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: decoded.name ?? null,
      image: decoded.picture ?? null,
      password: null,
      provider: legacyProvider(authProvider),
      firebaseUid: decoded.uid,
      authProvider,
      firebaseEmailVerified: decoded.email_verified === true,
      lastLoginAt: now,
      authMigratedAt: now,
      subscription: {
        create: { plan: 'FREE', status: 'INACTIVE' },
      },
    },
    include: { profile: { select: { id: true } }, coachProfile: { select: { id: true } } },
  })
  await linkSocialAccount(user.id, decoded, authProvider)
  return user
}
