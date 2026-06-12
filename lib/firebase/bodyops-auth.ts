'use client'

import type { UserCredential } from 'firebase/auth'
import { signIn } from 'next-auth/react'

/** Exchanges a Firebase user credential for a BodyOps DB user via the backend token verifier. */
export async function syncBodyOpsWithFirebaseCredential(credential: UserCredential) {
  const idToken = await credential.user.getIdToken()
  return syncBodyOpsUserWithFirebaseIdToken(idToken)
}

/** Verifies Firebase, links the DB user, then creates the temporary NextAuth session used by current routes. */
export async function signInBodyOpsWithFirebaseCredential(credential: UserCredential, callbackUrl = '/dashboard') {
  const session = await syncBodyOpsWithFirebaseCredential(credential)
  return signIn('firebase-handoff', {
    token: session.firebaseSessionToken,
    callbackUrl,
    redirect: true,
  })
}

/** Calls the Firebase-token backend sync endpoint without creating a NextAuth browser session. */
export async function syncBodyOpsUserWithFirebaseIdToken(idToken: string) {
  const res = await fetch('/api/auth/firebase/session', {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}` },
  })
  if (!res.ok) throw new Error('Impossible de synchroniser le compte Firebase avec BodyOps.')
  return res.json()
}
