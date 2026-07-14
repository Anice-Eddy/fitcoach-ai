'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { signIn } from 'next-auth/react'
import { signInWithPopup, type AuthError, type UserCredential } from 'firebase/auth'
import { toast } from 'sonner'
import { auth } from '@/lib/firebase/client'
import { facebookProvider, googleProvider } from '@/lib/firebase/providers'
import { useLocale } from '@/contexts/LocaleContext'
import type { LegalAcceptancePayload } from '@/lib/legal/consent'

type SocialProvider = 'google' | 'facebook'

type SocialAuthButtonsProps = {
  callbackUrl?: string
  disabled?: boolean
  legalAcceptance?: LegalAcceptancePayload
}

type SocialAuthError = Partial<AuthError> & {
  message?: string
}

function GoogleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#1877F2" d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z"/>
    </svg>
  )
}

function providerErrorMessage(error: unknown, t: (key: string) => string) {
  const code = (error as SocialAuthError | null)?.code
  const message = (error as SocialAuthError | null)?.message
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return null
  if (code === 'auth/configuration-not-found') {
    return t('auth.socialErrors.notConfigured')
  }
  if (code === 'auth/operation-not-allowed') {
    return t('auth.socialErrors.notEnabled')
  }
  if (code === 'auth/unauthorized-domain') {
    return t('auth.socialErrors.unauthorizedDomain')
  }
  if (code === 'auth/invalid-api-key') return t('auth.socialErrors.invalidConfig')
  if (code === 'auth/app-not-authorized') {
    return t('auth.socialErrors.appNotAuthorized')
  }
  if (code === 'auth/popup-blocked') return t('auth.socialErrors.popupBlocked')
  if (code === 'auth/account-exists-with-different-credential') {
    return t('auth.socialErrors.accountExists')
  }
  if (code === 'auth/network-request-failed') return t('auth.socialErrors.network')
  if (message) return message
  return t('auth.socialErrors.generic')
}

function SocialButton({
  label,
  icon,
  loading,
  disabled,
  onClick,
}: {
  label: string
  icon: ReactNode
  loading: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 disabled:opacity-50"
    >
      {loading ? <span className="size-5 rounded-full border-2 border-zinc-300 border-t-zinc-700 animate-spin" /> : icon}
      {label}
    </button>
  )
}

/** Google/Facebook sign-in through Firebase, then BodyOps/NextAuth session handoff. */
export function SocialAuthButtons({ callbackUrl = '/dashboard', disabled, legalAcceptance }: SocialAuthButtonsProps) {
  const { t } = useLocale()
  const [loading, setLoading] = useState<SocialProvider | null>(null)

  const exchangeCredential = async (credential: UserCredential, provider: SocialProvider) => {
    const firebaseToken = await credential.user.getIdToken()
    const res = await fetch('/api/auth/firebase-signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firebaseToken, provider, legalAcceptance }),
    })
    if (!res.ok) {
      const payload = await res.json().catch(() => null)
      throw new Error(payload?.error ?? t('auth.socialErrors.server'))
    }
    const data = await res.json()
    await signIn('firebase-handoff', {
      token: data.firebaseSessionToken,
      callbackUrl,
      redirect: true,
    })
  }

  const run = async (provider: SocialProvider) => {
    setLoading(provider)
    try {
      const credential = await signInWithPopup(auth(), provider === 'google' ? googleProvider() : facebookProvider())
      await exchangeCredential(credential, provider)
    } catch (error) {
      console.error('[social-auth] sign-in failed:', error)
      const message = providerErrorMessage(error, t)
      if (message) toast.error(message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      <SocialButton
        label={t('auth.continueWithGoogle')}
        icon={<GoogleIcon />}
        loading={loading === 'google'}
        disabled={disabled || loading === 'facebook'}
        onClick={() => run('google')}
      />
      <SocialButton
        label={t('auth.continueWithFacebook')}
        icon={<FacebookIcon />}
        loading={loading === 'facebook'}
        disabled={disabled || loading === 'google'}
        onClick={() => run('facebook')}
      />
    </div>
  )
}
