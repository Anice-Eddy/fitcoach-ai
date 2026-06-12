'use client'

import { SocialAuthButtons } from './SocialAuthButtons'

type FirebaseAuthButtonsProps = {
  callbackUrl: string
  disabled?: boolean
}

/** Compatibility wrapper while auth pages migrate to the shared Google/Facebook component. */
export function FirebaseAuthButtons(props: FirebaseAuthButtonsProps) {
  return <SocialAuthButtons {...props} />
}
