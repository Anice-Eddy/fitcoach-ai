import { createHmac, randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma/client'

const SECRET = process.env.AUTH_SECRET ?? ''

/** Legacy deterministic token kept only to accept old shortcuts generated before DB-backed tokens. */
export function generateAppleHealthToken(userId: string): string {
  return createHmac('sha256', SECRET)
    .update(`apple-health:${userId}`)
    .digest('hex')
}

/** Returns a stable Apple Health Shortcut token for the user, creating it once if needed. */
export async function getOrCreateAppleHealthToken(userId: string): Promise<string> {
  const existing = await prisma.integrationAccount.findUnique({
    where: { userId_service: { userId, service: 'APPLE_HEALTH' } },
    select: { accessToken: true },
  })

  if (existing?.accessToken) return `${userId}:${existing.accessToken}`

  const token = randomBytes(32).toString('base64url')
  await prisma.integrationAccount.upsert({
    where:  { userId_service: { userId, service: 'APPLE_HEALTH' } },
    update: { accessToken: token, isConnected: true, tokenExpiry: null },
    create: { userId, service: 'APPLE_HEALTH', accessToken: token, isConnected: true },
  })

  return `${userId}:${token}`
}

/** Verifies the Shortcut token against the stable DB token, with legacy HMAC fallback. */
export async function verifyAppleHealthToken(raw: string): Promise<string | null> {
  const clean = raw.trim()
  // Format: "{userId}:{hmac}"  — find LAST colon to be safe
  const colonIdx = clean.lastIndexOf(':')
  if (colonIdx === -1) return null
  const userId        = clean.substring(0, colonIdx).trim()
  const providedToken = clean.substring(colonIdx + 1).trim()
  if (!userId || !providedToken) return null

  const integration = await prisma.integrationAccount.findUnique({
    where: { userId_service: { userId, service: 'APPLE_HEALTH' } },
    select: { accessToken: true, tokenExpiry: true },
  })

  if (
    integration?.accessToken === providedToken &&
    (!integration.tokenExpiry || integration.tokenExpiry > new Date())
  ) {
    return userId
  }

  // Accept old generated tokens so existing shortcuts do not break immediately.
  const expected = generateAppleHealthToken(userId)
  return providedToken === expected ? userId : null
}
