import { createHmac } from 'crypto'

const SECRET = process.env.AUTH_SECRET ?? ''

export function generateAppleHealthToken(userId: string): string {
  return createHmac('sha256', SECRET)
    .update(`apple-health:${userId}`)
    .digest('hex')
}

export function verifyAppleHealthToken(raw: string): string | null {
  const clean = raw.trim()
  // Format: "{userId}:{hmac}"  — find LAST colon to be safe
  const colonIdx = clean.lastIndexOf(':')
  if (colonIdx === -1) return null
  const userId        = clean.substring(0, colonIdx).trim()
  const providedToken = clean.substring(colonIdx + 1).trim()
  if (!userId || !providedToken) return null
  const expected = generateAppleHealthToken(userId)
  return providedToken === expected ? userId : null
}
