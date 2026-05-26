'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Logo } from '@/components/ui/Logo'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.message ?? "Impossible d'envoyer le lien de réinitialisation.")
        return
      }

      setSent(true)
    } catch {
      toast.error('Erreur réseau, réessaie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
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
            <div className="text-4xl mb-3">📬</div>
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
