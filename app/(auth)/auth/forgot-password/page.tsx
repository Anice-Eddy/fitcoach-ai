'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Logo } from '@/components/ui/Logo'
import { PageBackground } from '@/components/landing/PageBackground'
import { publicAuthProviderMode } from '@/lib/auth/provider-mode'
import { firebaseForgotPassword } from '@/lib/firebase/client'

type FirebaseResetError = { code?: string; message?: string }

/** Forgot-password page: collects an email and calls /api/auth/forgot-password to send a reset link. */
export default function ForgotPasswordPage() {
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
      setError(data?.message ?? data?.error ?? "Impossible d'envoyer le lien de réinitialisation.")
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
      setError(data?.message ?? data?.error ?? "Impossible d'envoyer le lien de réinitialisation.")
      return false
    }

    try {
      await firebaseForgotPassword(email)
      return true
    } catch (err) {
      const code = (err as FirebaseResetError | null)?.code
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') return true
      if (code === 'auth/too-many-requests') {
        setError('Trop de demandes Firebase. Réessaie dans quelques minutes.')
        return false
      }
      if (code === 'auth/configuration-not-found' || code === 'auth/operation-not-allowed') {
        setError('La réinitialisation Firebase email/password n’est pas encore activée dans Firebase Console.')
        return false
      }
      setError("Impossible d'envoyer le lien Firebase pour le moment.")
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
      toast.error('Erreur réseau, réessaie.')
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
          <h1 className="text-2xl font-bold text-white">Mot de passe oublié</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Entre ton email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {sent ? (
          <div className="rounded-2xl bg-[#C8F135]/10 border border-[#C8F135]/30 p-6 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-[#C8F135]/35 bg-zinc-950/80 text-[#C8F135] shadow-[0_0_28px_rgba(200,241,53,0.22)]">
              <MailCheck className="size-7" aria-hidden="true" />
            </div>
            <p className="text-white font-semibold mb-1">Email envoyé !</p>
            <p className="text-zinc-400 text-sm">
              Si un compte existe pour <span className="text-white">{email}</span>,
              tu recevras un lien valable <strong className="text-white">1 heure</strong>.
            </p>
            <p className="text-zinc-500 text-xs mt-3">Pense à vérifier tes spams.</p>
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
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                placeholder="jean@example.com"
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
                : 'Envoyer le lien'}
            </button>
          </form>
        )}

        <Link
          href="/auth/signin"
          className="flex items-center justify-center gap-1.5 mt-6 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Retour à la connexion
        </Link>
      </div>
    </div>
  )
}
