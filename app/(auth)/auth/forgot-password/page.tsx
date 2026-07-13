'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Logo } from '@/components/ui/Logo'
import { PageBackground } from '@/components/landing/PageBackground'
import { publicAuthProviderMode } from '@/lib/auth/provider-mode'
import { firebaseForgotPassword } from '@/lib/firebase/client'
import { useLocale } from '@/contexts/LocaleContext'

type FirebaseResetError = { code?: string; message?: string }

function isTemporaryResetServiceError(err: unknown) {
  const error = err as FirebaseResetError | null
  const code = error?.code ?? ''
  const message = error?.message ?? ''

  return (
    code === 'auth/network-request-failed' ||
    code === 'auth/internal-error' ||
    message.includes('503') ||
    message.toLowerCase().includes('service unavailable')
  )
}

/** Forgot-password page: collects an email and calls /api/auth/forgot-password to send a reset link. */
export default function ForgotPasswordPage() {
  const { t } = useLocale()
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')
  const submitLockRef = useRef(false)
  const authMode = publicAuthProviderMode()
  const useFirebaseReset = authMode === 'firebase'

  const sendLegacyReset = async () => {
    const res = await fetch('/api/auth/forgot-password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, intent: 'legacy' }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      setError(data?.message ?? data?.error ?? t('auth.passwordReset.sendError'))
      return false
    }
    return true
  }

  const sendFirebaseReset = async () => {
    const res = await fetch('/api/auth/forgot-password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, intent: 'firebase' }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      setError(data?.message ?? data?.error ?? t('auth.passwordReset.sendError'))
      return false
    }

    try {
      await firebaseForgotPassword(email)
      return true
    } catch (err) {
      const code = (err as FirebaseResetError | null)?.code
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') return true
      if (code === 'auth/too-many-requests') {
        setError(t('auth.errors.tooManyRequests'))
        return false
      }
      if (code === 'auth/configuration-not-found' || code === 'auth/operation-not-allowed') {
        setError(t('auth.passwordReset.notEnabled'))
        return false
      }
      if (isTemporaryResetServiceError(err)) {
        setError(t('auth.passwordReset.temporarilyUnavailable'))
        return false
      }
      setError(t('auth.passwordReset.sendError'))
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitLockRef.current) return
    submitLockRef.current = true
    setLoading(true)
    setError('')

    try {
      const ok = useFirebaseReset ? await sendFirebaseReset() : await sendLegacyReset()
      if (ok) setSent(true)
      if (!ok) submitLockRef.current = false
    } catch {
      submitLockRef.current = false
      toast.error(t('auth.errors.networkRetry'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen text-white flex items-center justify-center px-4">
      <PageBackground showArtwork={false} />
      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mb-6 flex justify-center">
            <Logo href="/" size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t('auth.passwordReset.forgotTitle')}</h1>
          <p className="text-sm text-zinc-400 mt-1">
            {t('auth.passwordReset.forgotDescription')}
          </p>
        </div>

        {sent ? (
          <div className="rounded-2xl bg-[#C8F135]/10 border border-[#C8F135]/30 p-6 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-[#C8F135]/35 bg-zinc-950/80 text-[#C8F135] shadow-[0_0_28px_rgba(200,241,53,0.22)]">
              <MailCheck className="size-7" aria-hidden="true" />
            </div>
            <p className="text-white font-semibold mb-1">{t('auth.passwordReset.emailSent')}</p>
            <p className="text-zinc-400 text-sm">
              {t('auth.passwordReset.ifAccountExists')} <span className="text-white">{email}</span>,
              {t('auth.passwordReset.youWillReceive')} <strong className="text-white">{t('auth.passwordReset.oneHour')}</strong>.
            </p>
            <p className="text-zinc-500 text-xs mt-3">{t('auth.passwordReset.checkSpam')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                {t('auth.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                placeholder={t('auth.emailPlaceholder')}
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-semibold text-sm hover:bg-[#d4f54d] transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading
                ? <span className="size-5 rounded-full border-2 border-zinc-600 border-t-zinc-900 animate-spin" />
                : t('auth.passwordReset.sendLink')}
            </button>
          </form>
        )}

        <Link
          href="/auth/signin"
          className="flex items-center justify-center gap-1.5 mt-6 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="size-3.5" /> {t('auth.backToSignIn')}
        </Link>
      </div>
    </div>
  )
}
