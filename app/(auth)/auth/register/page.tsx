'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { BriefcaseBusiness, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { toast } from 'sonner'

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <RegisterForm />
    </Suspense>
  )
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isCoach = searchParams?.get('role') === 'coach' || searchParams?.get('callbackUrl')?.startsWith('/coach')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    bio: '',
    specialties: '',
    certifications: '',
    yearsExperience: '',
    city: '',
    phone: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setErrors((err) => ({ ...err, [e.target.name]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    const res = await fetch('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...form, accountType: isCoach ? 'COACH' : 'MEMBER' }),
    })

    const data = await res.json()

    if (!res.ok) {
      const fieldErrors: Record<string, string> = {}
      if (data.error && typeof data.error === 'object') {
        Object.entries(data.error).forEach(([k, v]) => {
          fieldErrors[k] = (v as string[])[0]
        })
      }
      setErrors(fieldErrors)
      setLoading(false)
      return
    }

    // Connexion automatique après inscription
    const result = await signIn('credentials', {
      email:       form.email,
      password:    form.password,
      redirect:    false,
    })

    if (result?.ok) {
      toast.success(isCoach ? 'Compte coach créé ! Bienvenue sur BodyOps' : 'Compte créé ! Bienvenue sur BodyOps')
      router.push(isCoach ? '/coach/dashboard' : '/onboarding')
    } else {
      toast.error('Compte créé mais connexion échouée — connectez-vous manuellement')
      router.push(isCoach ? '/auth/signin?callbackUrl=/coach/dashboard' : '/auth/signin')
    }
  }

  const handleGoogle = async () => {
    setLoadingGoogle(true)
    await signIn('google', { callbackUrl: '/onboarding' })
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      <div className={`w-full ${isCoach ? 'max-w-4xl' : 'max-w-sm'}`}>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mb-6 flex justify-center">
            <Logo href="/" size="lg" />
          </div>
          <div className="mb-3 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#C8F135]/30 bg-[#C8F135]/10 px-3 py-1 text-xs font-semibold text-[#C8F135]">
              {isCoach ? <BriefcaseBusiness className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
              {isCoach ? 'Inscription coach' : 'Inscription membre'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            {isCoach ? 'Créer un espace coach' : 'Créer un compte'}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {isCoach ? 'Profil professionnel, spécialités et coordonnées de suivi' : 'Gratuit, sans carte bancaire'}
          </p>
        </div>

        {/* Google */}
        {!isCoach && (
          <>
            <button
              onClick={handleGoogle}
              disabled={loadingGoogle || loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white text-zinc-900 font-medium text-sm hover:bg-zinc-100 transition-colors disabled:opacity-50 mb-4"
            >
              {loadingGoogle ? (
                <span className="size-5 rounded-full border-2 border-zinc-300 border-t-zinc-700 animate-spin" />
              ) : (
                <svg className="size-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continuer avec Google
            </button>

            {/* Séparateur */}
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-zinc-950 px-3 text-zinc-500">ou avec votre email</span>
              </div>
            </div>
          </>
        )}

        {isCoach && (
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            {[
              'Profil visible par les membres',
              'Accès tableau de bord coach',
              'Validation manuelle possible',
            ].map((item) => (
              <div key={item} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-center text-xs font-medium text-zinc-300">
                {item}
              </div>
            ))}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className={isCoach ? 'grid gap-4 md:grid-cols-2' : 'space-y-4'}>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Prénom / Nom
            </label>
            <input
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              placeholder={isCoach ? 'Coach Jean Dupont' : 'Jean Dupont'}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm"
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Adresse email
            </label>
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              placeholder="jean@example.com"
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm"
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
          </div>

          <div className={isCoach ? 'md:col-span-2' : undefined}>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                placeholder="8 caractères minimum"
                className="w-full px-4 py-3 pr-11 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
          </div>

          {isCoach && (
            <>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Bio professionnelle
                </label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Ex: Coach certifié, spécialisé en recomposition corporelle et préparation physique."
                  className="w-full resize-none px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm"
                />
                {errors.bio && <p className="mt-1 text-xs text-red-400">{errors.bio}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Spécialités
                </label>
                <input
                  name="specialties"
                  type="text"
                  value={form.specialties}
                  onChange={handleChange}
                  placeholder="Musculation, perte de poids, mobilité"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm"
                />
                {errors.specialties && <p className="mt-1 text-xs text-red-400">{errors.specialties}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Certifications
                </label>
                <input
                  name="certifications"
                  type="text"
                  value={form.certifications}
                  onChange={handleChange}
                  placeholder="BPJEPS AF, NASM, nutrition sportive"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm"
                />
                {errors.certifications && <p className="mt-1 text-xs text-red-400">{errors.certifications}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Années d'expérience
                </label>
                <input
                  name="yearsExperience"
                  type="number"
                  min={0}
                  max={60}
                  value={form.yearsExperience}
                  onChange={handleChange}
                  placeholder="5"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm"
                />
                {errors.yearsExperience && <p className="mt-1 text-xs text-red-400">{errors.yearsExperience}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Ville
                </label>
                <input
                  name="city"
                  type="text"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Paris, Lyon, Montréal..."
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm"
                />
                {errors.city && <p className="mt-1 text-xs text-red-400">{errors.city}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Téléphone professionnel
                </label>
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+33 6 12 34 56 78"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm"
                />
                {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading || loadingGoogle}
            className={`w-full py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-semibold text-sm hover:bg-[#d4f54d] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${isCoach ? 'md:col-span-2' : ''}`}
          >
            {loading ? (
              <span className="size-5 rounded-full border-2 border-zinc-600 border-t-zinc-900 animate-spin" />
            ) : isCoach ? 'Créer mon espace coach' : 'Créer mon compte gratuit'}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-500 mt-5">
          En créant un compte, vous acceptez nos{' '}
          <span className="text-zinc-400 cursor-pointer hover:underline">CGU</span> et notre{' '}
          <span className="text-zinc-400 cursor-pointer hover:underline">politique de confidentialité</span>.
        </p>

        <p className="text-center text-sm text-zinc-400 mt-4">
          Déjà un compte ?{' '}
          <Link href={isCoach ? '/auth/signin?callbackUrl=/coach/dashboard' : '/auth/signin'} className="text-[#C8F135] hover:underline font-medium">
            Se connecter
          </Link>
        </p>
        <p className="text-center text-sm text-zinc-500 mt-3">
          {isCoach ? 'Vous êtes membre ?' : 'Vous êtes coach ?'}{' '}
          <Link href={isCoach ? '/auth/register' : '/auth/register?role=coach'} className="text-zinc-300 hover:text-[#C8F135] transition-colors">
            {isCoach ? 'Créer un compte membre' : 'Créer un espace coach'}
          </Link>
        </p>
      </div>
    </div>
  )
}
