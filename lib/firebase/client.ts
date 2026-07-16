'use client'

import { getApp, getApps, initializeApp } from 'firebase/app'
import {
  applyActionCode,
  checkActionCode,
  confirmPasswordReset,
  getAuth,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  verifyBeforeUpdateEmail,
  verifyPasswordResetCode,
} from 'firebase/auth'
import { facebookProvider, googleProvider } from './providers'

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

class FirebaseClientConfigError extends Error {
  code = 'auth/client-config-missing'

  constructor() {
    super('Authentication configuration is unavailable.')
    this.name = 'FirebaseClientConfigError'
  }
}

function assertFirebaseClientConfig() {
  const missing = [
    ['NEXT_PUBLIC_FIREBASE_API_KEY', firebaseConfig.apiKey],
    ['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain],
    ['NEXT_PUBLIC_FIREBASE_PROJECT_ID', firebaseConfig.projectId],
    ['NEXT_PUBLIC_FIREBASE_APP_ID', firebaseConfig.appId],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[auth-client] Missing client auth config:', missing.join(', '))
    }
    throw new FirebaseClientConfigError()
  }
}

function firebaseApp() {
  assertFirebaseClientConfig()
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
}

function firebaseAuth() {
  return getAuth(firebaseApp())
}

function actionCodeSettings(continuePath = '/dashboard') {
  if (typeof window === 'undefined') return undefined
  return {
    url: `${window.location.origin}${continuePath}`,
    handleCodeInApp: false,
  }
}

export const auth = firebaseAuth

export async function firebaseEmailSignIn(email: string, password: string) {
  return signInWithEmailAndPassword(firebaseAuth(), email, password)
}

export async function firebaseEmailRegister(email: string, password: string, displayName?: string) {
  const credential = await createUserWithEmailAndPassword(firebaseAuth(), email, password)
  if (displayName?.trim()) {
    await updateProfile(credential.user, { displayName: displayName.trim() })
  }
  await sendEmailVerification(credential.user, actionCodeSettings('/dashboard'))
  return credential
}

export async function firebaseSendCurrentUserEmailVerification(continuePath = '/dashboard') {
  const user = firebaseAuth().currentUser
  if (!user) throw new Error('Sign in to verify your email.')
  await sendEmailVerification(user, actionCodeSettings(continuePath))
}

export async function firebaseRequestEmailChange(newEmail: string, continuePath = '/settings/profile') {
  const user = firebaseAuth().currentUser
  if (!user) throw new Error('Sign in again to update your email.')
  await verifyBeforeUpdateEmail(user, newEmail, actionCodeSettings(continuePath))
}

export function firebaseGoogleSignIn() {
  return signInWithPopup(firebaseAuth(), googleProvider())
}

export function firebaseFacebookSignIn() {
  return signInWithPopup(firebaseAuth(), facebookProvider())
}

export function firebaseForgotPassword(email: string) {
  return sendPasswordResetEmail(firebaseAuth(), email, actionCodeSettings('/auth/signin'))
}

export function firebaseCheckActionCode(code: string) {
  return checkActionCode(firebaseAuth(), code)
}

export function firebaseApplyActionCode(code: string) {
  return applyActionCode(firebaseAuth(), code)
}

export function firebaseVerifyPasswordResetCode(code: string) {
  return verifyPasswordResetCode(firebaseAuth(), code)
}

export function firebaseConfirmPasswordReset(code: string, newPassword: string) {
  return confirmPasswordReset(firebaseAuth(), code, newPassword)
}

export async function firebaseCurrentUserIdToken(forceRefresh = true) {
  const user = firebaseAuth().currentUser
  if (!user) return null
  await reload(user)
  return user.getIdToken(forceRefresh)
}
