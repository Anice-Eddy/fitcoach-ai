'use client'

import { FacebookAuthProvider, GoogleAuthProvider } from 'firebase/auth'

export function googleProvider() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  return provider
}

export function facebookProvider() {
  // Facebook fournit public_profile par défaut. Ne pas demander email ici:
  // certaines apps Meta le refusent tant que la permission n'est pas configurée.
  return new FacebookAuthProvider()
}
