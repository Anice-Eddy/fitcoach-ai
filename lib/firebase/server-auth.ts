import { NextResponse, type NextRequest } from 'next/server'
import { verifyFirebaseIdToken } from '@/lib/firebase/admin'
import { findOrCreateUserFromFirebase } from '@/lib/firebase/users'

function bearerToken(req: NextRequest) {
  const header = req.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length).trim()
}

/** Verifies Authorization: Bearer <Firebase ID token> and resolves the BodyOps user. */
export async function requireFirebaseUser(req: NextRequest) {
  const token = bearerToken(req)
  if (!token) {
    return { error: NextResponse.json({ error: 'Token Firebase manquant' }, { status: 401 }) }
  }

  try {
    const decoded = await verifyFirebaseIdToken(token)
    const user = await findOrCreateUserFromFirebase(decoded)
    return { decoded, user }
  } catch (error) {
    console.error('[firebase-auth] token verification failed:', error)
    return { error: NextResponse.json({ error: 'Token Firebase invalide ou expiré' }, { status: 401 }) }
  }
}
