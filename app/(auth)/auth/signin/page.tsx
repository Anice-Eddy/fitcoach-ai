'use client'

import { Suspense, useEffect, useState } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Dumbbell, Users } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { PageBackground } from '@/components/landing/PageBackground'
import { clearClientAccountState } from '@/lib/auth/client-session'
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons'
import { canUseFirebaseAuth, canUseNextAuth, publicAuthProviderMode } from '@/lib/auth/provider-mode'
import { firebaseEmailSignIn } from '@/lib/firebase/client'
import { createBodyOpsNextAuthSession, syncBodyOpsWithFirebaseCredential } from '@/lib/firebase/bodyops-auth'
import { useLocale } from '@/contexts/LocaleContext'

type FirebaseAuthError = { code?: string; message?: string }

function firebaseSignInErrorMessage(error: unknown, t: (key: string) => string) {
  const code = (error as FirebaseAuthError | null)?.code
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return t('auth.errors.invalidCredentials')
  }
  if (code === 'auth/too-many-requests') return t('auth.errors.tooManyRequests')
  if (code === 'auth/operation-not-allowed') return t('auth.errors.emailSignInDisabled')
  return t('auth.errors.signInUnavailable')
}

/** Sign-in page shell wrapping the SignInForm in a Suspense boundary for searchParams access. */
export default function SignInPage() {
  return (
    <div className="relative min-h-screen text-white">
      <PageBackground showArtwork={false} />
      <Suspense fallback={<div className="min-h-screen" />}>
        <SignInForm />
      </Suspense>
    </div>
  )
}

function SignInForm() {
  const { t } = useLocale()
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  const callbackParam = searchParams?.get('callbackUrl')
  const authError     = searchParams?.get('error') ?? ''

  const [mode, setMode] = useState<'member' | 'coach'>(
    callbackParam?.includes('/coach') || searchParams?.get('role') === 'coach' ? 'coach' : 'member',
  )
  const [showPassword, setShowPassword]   = useState(false)
  const [loading, setLoading]             = useState(false)
  const [form, setForm]                   = useState({ email: '', password: '' })
  const [error, setError]                 = useState('')
  const authMode = publicAuthProviderMode()
  const showFirebase = canUseFirebaseAuth(authMode)
  const showNextAuth = canUseNextAuth(authMode)
  const useFirebaseEmail = authMode === 'firebase'

  useEffect(() => {
    if (authError === 'OAuthAccountNotLinked' && sessionStorage.getItem('bodyops:last-auth-context') === 'coach') {
      setMode('coach')
    }
  }, [authError])

  const urlError = authError === 'OAuthAccountNotLinked'
    ? t('auth.errors.oauthAccountNotLinked')
    : authError === 'CredentialsSignin'
      ? t('auth.errors.invalidCredentials')
      : ''
  const displayedError = error || urlError

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (useFirebaseEmail) {
        if (status === 'authenticated') {
          clearClientAccountState()
          await signOut({ redirect: false })
        }

        const credential = await firebaseEmailSignIn(form.email.trim().toLowerCase(), form.password)
        const bodyOpsSession = await syncBodyOpsWithFirebaseCredential(credential)
        const user = bodyOpsSession.user

        if (mode === 'member' && user?.isCoach && !user?.hasMemberProfile) {
          setError(t('auth.errors.coachAccountUseCoachTab'))
          return
        }
        if (mode === 'coach' && !user?.isCoach) {
          setError(t('auth.errors.memberAccountUseMemberTab'))
          return
        }

        sessionStorage.removeItem('bodyops:last-auth-context')
        await createBodyOpsNextAuthSession(
          bodyOpsSession.firebaseSessionToken,
          mode === 'coach' ? '/coach/dashboard' : '/dashboard',
        )
        return
      }

      const provider = await fetch(`/api/auth/check-provider?email=${encodeURIComponent(form.email)}`)
        .then((r) => r.json())
        .catch(() => ({ provider: null }))

      if (!provider.provider) {
        setError(t('auth.errors.emailNotFound'))
        return
      }

      if (provider.provider === 'GOOGLE' || provider.provider === 'FACEBOOK') {
        setError(t('auth.errors.socialProviderRequired'))
        return
      }

      const validation = await fetch('/api/auth/validate-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
        .then((r) => r.json())
        .catch(() => ({ valid: false, reason: 'SERVER_ERROR' }))

      if (!validation.valid) {
        setError(validation.reason === 'EMAIL_NOT_FOUND'
          ? t('auth.errors.emailNotFound')
          : t('auth.errors.wrongPassword'))
        return
      }

      // Role mismatch check: prevent a coach from logging in as member and vice versa.
      if (mode === 'member' && validation.isCoach && !validation.isMember) {
        setError(t('auth.errors.coachAccountUseCoachTab'))
        return
      }
      if (mode === 'coach' && !validation.isCoach) {
        setError(t('auth.errors.memberAccountUseMemberTab'))
        return
      }

      if (status === 'authenticated') {
        clearClientAccountState()
        await signOut({ redirect: false })
      }

      const result = await signIn('credentials', {
        email:    form.email,
        password: form.password,
        redirect: false,
      })

      if (result?.ok) {
        sessionStorage.removeItem('bodyops:last-auth-context')
        router.push(mode === 'coach' ? '/coach/dashboard' : '/dashboard')
      } else {
        setError(t('auth.errors.wrongPassword'))
      }
    } catch (err) {
      setError(useFirebaseEmail ? firebaseSignInErrorMessage(err, t) : t('auth.errors.genericRetry'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="mb-6 flex justify-center">
            <Logo href="/" size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {mode === 'coach' ? t('auth.coachSignIn') : t('auth.signIn')}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {mode === 'coach' ? t('auth.coachAccess') : t('auth.memberAccess')}
          </p>
        </div>

        {/* Member/coach mode toggle */}
        <div className="flex rounded-xl border border-zinc-800 bg-zinc-900 p-1 mb-6">
          <button type="button" onClick={() => setMode('member')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
              mode === 'member' ? 'bg-[#C8F135] text-zinc-900' : 'text-zinc-400 hover:text-white'
            }`}>
            <Dumbbell className="size-4" /> {t('auth.member')}
          </button>
          <button type="button" onClick={() => setMode('coach')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
              mode === 'coach' ? 'bg-[#C8F135] text-zinc-900' : 'text-zinc-400 hover:text-white'
            }`}>
            <Users className="size-4" /> {t('auth.coach')}
          </button>
        </div>

        {showFirebase && (
          <div className="mb-3">
            <SocialAuthButtons callbackUrl={mode === 'coach' ? '/coach/dashboard' : '/dashboard'} disabled={loading} />
          </div>
        )}

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-zinc-950 px-3 text-zinc-500">{t('auth.orWithEmail')}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {displayedError && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {displayedError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('auth.email')}</label>
            <input name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange}
              placeholder={t('auth.emailPlaceholder')}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-zinc-300">{t('auth.password')}</label>
              <Link href="/auth/forgot-password" className="text-xs text-zinc-500 hover:text-[#C8F135] transition-colors">
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <div className="relative">
              <input name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                value={form.password} onChange={handleChange} placeholder="••••••••"
                className="w-full px-4 py-3 pr-11 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm" />
              <button type="button" onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {(showFirebase || showNextAuth) && (
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-semibold text-sm hover:bg-[#d4f54d] transition-colors disabled:opacity-50 flex items-center justify-center">
            {loading
              ? <span className="size-5 rounded-full border-2 border-zinc-600 border-t-zinc-900 animate-spin" />
              : `${t('auth.submitForRole')} ${mode === 'coach' ? t('auth.coachSpace') : t('auth.memberSpace')}`}
          </button>
          )}
        </form>

        <p className="text-center text-sm text-zinc-400 mt-5">
          {t('auth.noAccount')}{' '}
          <Link href={mode === 'coach' ? '/auth/register/coach' : '/auth/register/member'}
            className="text-[#C8F135] hover:underline font-medium">
            {t('auth.createAccountForRole')} {mode === 'coach' ? t('auth.coach').toLowerCase() : t('auth.member').toLowerCase()}
          </Link>
        </p>
      </div>
    </div>
  )
}
