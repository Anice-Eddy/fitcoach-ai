'use client'

import { useState } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ChevronLeft } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { toast } from 'sonner'
import { PageBackground } from '@/components/landing/PageBackground'
import { clearClientAccountState } from '@/lib/auth/client-session'
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons'
import { canUseFirebaseAuth, canUseNextAuth, publicAuthProviderMode } from '@/lib/auth/provider-mode'
import { firebaseEmailRegister } from '@/lib/firebase/client'
import { signInBodyOpsWithFirebaseCredential } from '@/lib/firebase/bodyops-auth'
import { useLocale } from '@/contexts/LocaleContext'

type FirebaseAuthError = { code?: string; message?: string }

function firebaseRegisterErrorMessage(error: unknown, t: (key: string) => string) {
  const code = (error as FirebaseAuthError | null)?.code
  if (code === 'auth/email-already-in-use') return t('auth.register.errors.emailExists')
  if (code === 'auth/weak-password') return t('auth.register.errors.weakPassword')
  if (code === 'auth/invalid-email') return t('auth.register.errors.invalidEmail')
  if (code === 'auth/operation-not-allowed') return t('auth.register.errors.emailNotEnabled')
  return t('auth.register.errors.generic')
}

/** Member registration form: collects name, email, and password; posts to /api/auth/register and redirects on success. */
export default function MemberRegisterPage() {
  const { t } = useLocale()
  const router = useRouter()
  const { status } = useSession()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const authMode = publicAuthProviderMode()
  const showFirebase = canUseFirebaseAuth(authMode)
  const showNextAuth = canUseNextAuth(authMode)
  const useFirebaseEmail = authMode === 'firebase'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setErrors((err) => ({ ...err, [e.target.name]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    if (useFirebaseEmail) {
      try {
        if (status === 'authenticated') {
          clearClientAccountState()
          await signOut({ redirect: false })
        }

        const credential = await firebaseEmailRegister(
          form.email.trim().toLowerCase(),
          form.password,
          form.name,
        )
        toast.success(t('auth.register.member.firebaseCreated'))
        await signInBodyOpsWithFirebaseCredential(credential, '/onboarding')
      } catch (err) {
        setErrors({ email: firebaseRegisterErrorMessage(err, t) })
        setLoading(false)
      }
      return
    }

    const res = await fetch('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...form, email: form.email.trim().toLowerCase() }),
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      const fieldErrors: Record<string, string> = {}
      if (data.error && typeof data.error === 'object') {
        Object.entries(data.error).forEach(([k, v]) => {
          fieldErrors[k] = Array.isArray(v) ? String(v[0]) : String(v)
        })
      }
      if (Object.keys(fieldErrors).length === 0) {
        fieldErrors.email = data?.message ?? data?.error ?? t('auth.register.errors.generic')
      }
      setErrors(fieldErrors)
      setLoading(false)
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
      toast.success(t('auth.register.member.created'))
      router.push('/onboarding')
    } else {
      toast.error(t('auth.register.member.manualSignin'))
      router.push('/auth/signin')
    }
  }

  return (
    <div className="relative min-h-screen text-white flex items-center justify-center px-4 py-12">
      <PageBackground showArtwork={false} />
      <div className="relative z-10 w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="mb-6 flex justify-center">
            <Logo href="/" size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t('auth.register.member.title')}</h1>
          <p className="text-sm text-zinc-400 mt-1">{t('auth.register.free')}</p>
        </div>

        {showFirebase && (
          <div className="mb-4 space-y-2">
            <SocialAuthButtons callbackUrl="/onboarding" disabled={loading} />
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
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('auth.register.fullName')}</label>
            <input name="name" type="text" autoComplete="name" value={form.name} onChange={handleChange}
              placeholder={t('auth.register.member.namePlaceholder')}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm" />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('auth.email')}</label>
            <input name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange}
              placeholder={t('auth.emailPlaceholder')}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm" />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('auth.password')}</label>
            <div className="relative">
              <input name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                value={form.password} onChange={handleChange} placeholder={t('auth.register.passwordPlaceholder')}
                className="w-full px-4 py-3 pr-11 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm" />
              <button type="button" onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
          </div>

          {(showFirebase || showNextAuth) && (
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-semibold text-sm hover:bg-[#d4f54d] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <span className="size-5 rounded-full border-2 border-zinc-600 border-t-zinc-900 animate-spin" /> : t('auth.register.member.submit')}
          </button>
          )}
        </form>

        <div className="flex items-center justify-between mt-5">
          <Link href="/auth/register" className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            <ChevronLeft className="size-3" /> {t('common.back')}
          </Link>
          <Link href="/auth/signin" className="text-xs text-zinc-400 hover:text-[#C8F135] transition-colors">
            {t('auth.register.alreadyAccount')}
          </Link>
        </div>
      </div>
    </div>
  )
}
