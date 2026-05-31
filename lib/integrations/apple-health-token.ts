// HMAC-based personal access token for the Apple Health iOS Shortcut.
// Token = base64url( HMAC-SHA256( "apple-health:" + userId, AUTH_SECRET ) )
// No DB migration needed — deterministic and verifiable server-side.

import { createHmac } from 'crypto'

const SECRET = process.env.AUTH_SECRET ?? ''

export function generateAppleHealthToken(userId: string): string {
  return createHmac('sha256', SECRET)
    .update(`apple-health:${userId}`)
    .digest('base64url')
}

export function verifyAppleHealthToken(token: string): string | null {
  // We can't reverse-derive userId from the token, so the token must be sent
  // alongside the userId (in the Authorization header as "Bearer userId:token").
  const [userId, providedToken] = token.split(':')
  if (!userId || !providedToken) return null
  const expected = generateAppleHealthToken(userId)
  return providedToken === expected ? userId : null
}
