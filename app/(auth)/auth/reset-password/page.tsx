'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Logo } from '@/components/ui/Logo'
import { PageBackground } from '@/components/landing/PageBackground'
import { useLocale } from '@/contexts/LocaleContext'

/** Reset-password page shell wrapping the ResetPasswordForm in a Suspense boundary for token searchParam. */
export default function ResetPasswordPage() {
  return (
    <div className="relative min-h-screen text-white">
      <PageBackground showArtwork={false} />
      <Suspense fallback={<div className="min-h-screen" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}

function ResetPasswordForm() {
  const { t } = useLocale()
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams?.get('token') ?? ''

  const [password,    setPassword]    = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [done,        setDone]        = useState(false)

  if (!token) {
    return (
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">{t('auth.passwordReset.invalidOrMissingLink')}</p>
          <Link href="/auth/forgot-password" className="text-[#C8F135] hover:underline text-sm">
            {t('auth.passwordReset.requestNewLink')}
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      toast.error(t('auth.passwordReset.passwordMismatch'))
      return
    }
    if (password.length < 8) {
      toast.error(t('auth.passwordReset.minLength'))
      return
    }

    setLoading(true)
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? t('auth.passwordReset.resetError'))
        return
      }

      setDone(true)
      setTimeout(() => router.push('/auth/signin'), 3000)
    } catch {
      toast.error(t('auth.errors.networkRetry'))
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
          <h1 className="text-2xl font-bold text-white">{t('auth.passwordReset.newPasswordTitle')}</h1>
          <p className="text-sm text-zinc-400 mt-1">{t('auth.passwordReset.chooseSecurePassword')}</p>
        </div>

        {done ? (
          <div className="rounded-2xl bg-[#C8F135]/10 border border-[#C8F135]/30 p-6 text-center">
            <div className="flex justify-center mb-3"><CheckCircle className="size-10 text-[#C8F135]" /></div>
            <p className="text-white font-semibold mb-1">{t('auth.passwordReset.updated')}</p>
            <p className="text-zinc-400 text-sm">{t('auth.passwordReset.redirectSignIn')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                {t('auth.passwordReset.newPassword')}
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordReset.minLength')}
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                {t('auth.passwordReset.confirmPassword')}
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder={t('auth.passwordReset.repeatPassword')}
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {password.length > 0 && (
              <div className="flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      password.length >= [8, 10, 12, 16][i]
                        ? i < 2 ? 'bg-amber-400' : 'bg-[#C8F135]'
                        : 'bg-zinc-800'
                    }`}
                  />
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password || !confirm}
              className="w-full py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-semibold text-sm hover:bg-[#d4f54d] transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading
                ? <span className="size-5 rounded-full border-2 border-zinc-600 border-t-zinc-900 animate-spin" />
                : t('auth.passwordReset.savePassword')}
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
