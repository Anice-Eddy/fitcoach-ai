import { cert, getApps, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app'
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth'

type FirebaseServiceAccount = {
  project_id: string
  client_email: string
  private_key: string
}

function parseServiceAccountJson(value: string): ServiceAccount {
  let parsed: FirebaseServiceAccount
  try {
    parsed = JSON.parse(value) as FirebaseServiceAccount
  } catch {
    // .env files often store JSON as a single escaped string: {\"type\":\"service_account\",...}
    parsed = JSON.parse(value.replace(/\\"/g, '"')) as FirebaseServiceAccount
  }

  return {
    projectId: parsed.project_id,
    clientEmail: parsed.client_email,
    privateKey: normalizePrivateKey(parsed.private_key),
  }
}

function normalizePrivateKey(value?: string) {
  return value
    ?.replace(/\\n/g, '\n')
    ?.replace(/\\\n/g, '\n')
}

function firstNonEmpty(...values: Array<string | undefined>) {
  return values.find((value) => value && value.trim().length > 0)
}

// Ce fichier ne doit jamais être importé depuis un composant React ou une page client.
function firebaseAdminApp(): App {
  if (getApps().length > 0) return getApps()[0]

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (serviceAccountJson) {
    return initializeApp({
      credential: cert(parseServiceAccountJson(serviceAccountJson)),
    })
  }

  const projectId = firstNonEmpty(process.env.FIREBASE_ADMIN_PROJECT_ID, process.env.FIREBASE_PROJECT_ID)
  const clientEmail = firstNonEmpty(process.env.FIREBASE_ADMIN_CLIENT_EMAIL, process.env.FIREBASE_CLIENT_EMAIL)
  const privateKey = normalizePrivateKey(firstNonEmpty(process.env.FIREBASE_ADMIN_PRIVATE_KEY, process.env.FIREBASE_PRIVATE_KEY))

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_ADMIN_PROJECT_ID/FIREBASE_ADMIN_CLIENT_EMAIL/FIREBASE_ADMIN_PRIVATE_KEY.')
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  })
}

export function firebaseAdminAuth() {
  return getAuth(firebaseAdminApp())
}

export const adminAuth = firebaseAdminAuth

/** Verifies a Firebase ID token server-side; never trust frontend tokens without this check. */
export async function verifyFirebaseIdToken(idToken: string, checkRevoked = true): Promise<DecodedIdToken> {
  return firebaseAdminAuth().verifyIdToken(idToken, checkRevoked)
}
