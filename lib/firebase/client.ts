'use client'

import { getApp, getApps, initializeApp } from 'firebase/app'
import {
  getAuth,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
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
    throw new Error(`Configuration Firebase client manquante: ${missing.join(', ')}`)
  }
}

function firebaseApp() {
  assertFirebaseClientConfig()
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
}

function firebaseAuth() {
  return getAuth(firebaseApp())
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
  await sendEmailVerification(credential.user)
  return credential
}

export function firebaseGoogleSignIn() {
  return signInWithPopup(firebaseAuth(), googleProvider())
}

export function firebaseFacebookSignIn() {
  return signInWithPopup(firebaseAuth(), facebookProvider())
}

export function firebaseForgotPassword(email: string) {
  return sendPasswordResetEmail(firebaseAuth(), email)
}
