'use client'

import { FacebookAuthProvider, GoogleAuthProvider } from 'firebase/auth'

export function googleProvider() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  return provider
}

export function facebookProvider() {
  // Facebook provides public_profile by default. Do not request email here:
  // some Meta apps reject it until the permission is configured.
  return new FacebookAuthProvider()
}
