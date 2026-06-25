'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, MailCheck, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Logo } from '@/components/ui/Logo'
import { PageBackground } from '@/components/landing/PageBackground'
import {
  firebaseApplyActionCode,
  firebaseCheckActionCode,
  firebaseConfirmPasswordReset,
  firebaseCurrentUserIdToken,
  firebaseVerifyPasswordResetCode,
} from '@/lib/firebase/client'
import { createBodyOpsNextAuthSession, syncBodyOpsUserWithFirebaseIdToken } from '@/lib/firebase/bodyops-auth'

type ActionMode = 'resetPassword' | 'recoverEmail' | 'verifyEmail'

/** Firebase email-action handler for reset password, recover email, and email verification links. */
export default function FirebaseActionPage() {
  return (
    <div className="relative min-h-screen text-white">
      <PageBackground showArtwork={false} />
      <Suspense fallback={<div className="min-h-screen" />}>
        <FirebaseActionForm />
      </Suspense>
    </div>
  )
}

function FirebaseActionForm() {
  const params = useSearchParams()
  const mode = params?.get('mode') as ActionMode | null
  const oobCode = params?.get('oobCode') ?? ''
  const continueUrl = params?.get('continueUrl') ?? '/auth/signin'

  const [status, setStatus] = useState<'loading' | 'ready' | 'done' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [handoffToken, setHandoffToken] = useState<string | null>(null)

  const isReset = mode === 'resetPassword'
  const safeContinueUrl = useMemo(() => {
    try {
      const url = new URL(continueUrl, window.location.origin)
      return url.origin === window.location.origin ? `${url.pathname}${url.search}` : '/auth/signin'
    } catch {
      return '/auth/signin'
    }
  }, [continueUrl])

  const syncCurrentFirebaseUser = async () => {
    const idToken = await firebaseCurrentUserIdToken(true).catch(() => null)
    if (!idToken) return
    const session = await syncBodyOpsUserWithFirebaseIdToken(idToken).catch(() => null)
    if (session?.firebaseSessionToken) setHandoffToken(session.firebaseSessionToken)
  }

  const continueToBodyOps = async () => {
    if (handoffToken) {
      await createBodyOpsNextAuthSession(handoffToken, safeContinueUrl)
      return
    }
    window.location.href = safeContinueUrl
  }

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!mode || !oobCode || !['resetPassword', 'recoverEmail', 'verifyEmail'].includes(mode)) {
        setStatus('error')
        setMessage('Lien invalide ou incomplet.')
        return
      }

      try {
        if (mode === 'resetPassword') {
          const verifiedEmail = await firebaseVerifyPasswordResetCode(oobCode)
          if (cancelled) return
          setEmail(verifiedEmail)
          setStatus('ready')
          return
        }

        if (mode === 'recoverEmail') {
          const info = await firebaseCheckActionCode(oobCode)
          await firebaseApplyActionCode(oobCode)
          await syncCurrentFirebaseUser()
          if (cancelled) return
          setEmail(info.data.email ?? '')
          setMessage('Adresse email restaurée. Si tu n’es pas à l’origine de cette action, change ton mot de passe.')
          setStatus('done')
          return
        }

        await firebaseApplyActionCode(oobCode)
        await syncCurrentFirebaseUser()
        if (cancelled) return
        setMessage('Adresse email vérifiée. Tu peux continuer sur BodyOps.')
        setStatus('done')
      } catch {
        if (cancelled) return
        setStatus('error')
        setMessage('Ce lien est invalide ou expiré. Demande un nouveau lien depuis BodyOps.')
      }
    }
    run()
    return () => { cancelled = true }
  }, [mode, oobCode])

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Minimum 8 caractères.')
      return
    }
    if (password !== confirm) {
      toast.error('Les mots de passe ne correspondent pas.')
      return
    }

    setStatus('loading')
    try {
      await firebaseConfirmPasswordReset(oobCode, password)
      setMessage('Mot de passe mis à jour. Tu peux te connecter avec ton nouveau mot de passe.')
      setStatus('done')
    } catch {
      setStatus('error')
      setMessage('Impossible de mettre à jour le mot de passe. Demande un nouveau lien.')
    }
  }

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-6 flex justify-center">
            <Logo href="/" size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {isReset ? 'Nouveau mot de passe' : 'Validation du compte'}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            BodyOps sécurise ton compte par email.
          </p>
        </div>

        {status === 'loading' && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
            <span className="mx-auto block size-7 rounded-full border-2 border-zinc-700 border-t-[#C8F135] animate-spin" />
            <p className="mt-4 text-sm text-zinc-400">Vérification du lien...</p>
          </div>
        )}

        {status === 'ready' && isReset && (
          <form onSubmit={submitReset} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="rounded-xl border border-[#C8F135]/25 bg-[#C8F135]/10 px-4 py-3 text-xs text-[#C8F135]">
              Réinitialisation pour {email}
            </div>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-zinc-300">Nouveau mot de passe</span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 pr-11 text-sm text-white outline-none focus:border-[#C8F135]"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-zinc-300">Confirmer</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-[#C8F135]"
              />
            </label>
            <button type="submit" className="w-full rounded-xl bg-[#C8F135] px-4 py-3 text-sm font-bold text-zinc-950 transition-colors hover:bg-[#d4f54d]">
              Mettre à jour
            </button>
          </form>
        )}

        {status === 'done' && (
          <div className="rounded-2xl border border-[#C8F135]/30 bg-[#C8F135]/10 p-6 text-center">
            {mode === 'recoverEmail' ? (
              <RotateCcw className="mx-auto mb-4 size-10 text-[#C8F135]" />
            ) : mode === 'verifyEmail' ? (
              <MailCheck className="mx-auto mb-4 size-10 text-[#C8F135]" />
            ) : (
              <CheckCircle2 className="mx-auto mb-4 size-10 text-[#C8F135]" />
            )}
            <p className="text-sm font-semibold text-white">{message}</p>
            <button type="button" onClick={continueToBodyOps} className="mt-5 inline-flex rounded-xl bg-[#C8F135] px-4 py-2.5 text-sm font-bold text-zinc-950">
              Continuer
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-6 text-center">
            <p className="text-sm font-semibold text-red-200">{message}</p>
            <Link href="/auth/forgot-password" className="mt-5 inline-flex rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-200">
              Demander un nouveau lien
            </Link>
          </div>
        )}

        <Link href="/auth/signin" className="mt-6 flex items-center justify-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300">
          <ArrowLeft className="size-3.5" /> Retour à la connexion
        </Link>
      </div>
    </div>
  )
}
