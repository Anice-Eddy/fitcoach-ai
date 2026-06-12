import type { DecodedIdToken } from 'firebase-admin/auth'
import { adminAuth } from './admin'

export async function verifyFirebaseToken(token: string): Promise<DecodedIdToken | null> {
  try {
    return await adminAuth().verifyIdToken(token, true)
  } catch {
    return null
  }
}
