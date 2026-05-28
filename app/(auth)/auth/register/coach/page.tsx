'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ChevronLeft, Check } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { toast } from 'sonner'
import { PageBackground } from '@/components/landing/PageBackground'

const SPECIALTIES = [
  'Force & Powerlifting', 'Hypertrophie', 'Perte de poids', 'Cardio & Endurance',
  'Nutrition sportive', 'Réhabilitation', 'CrossFit', 'Course à pied',
  'Yoga & Souplesse', 'Boxe & Arts martiaux', 'Natation', 'Préparation physique',
]

const CERTIFICATIONS = [
  'BPJEPS APT', 'BPJEPS AGFF', 'DEUG / Licence STAPS', 'DEUST MF',
  'CQP IF', 'Diplôme fédéral', 'Personal Trainer NASM', 'Personal Trainer ACE',
  'Nutrition sportive certifiée', 'CrossFit L1 / L2', 'Yoga RYT 200',
]

type Step = 1 | 2 | 3

/** Multi-step coach registration form: collects account credentials, professional profile, and certifications; posts to /api/auth/register/coach. */
export default function CoachRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    name:            '',
    email:           '',
    password:        '',
    bio:             '',
    specialties:     [] as string[],
    certifications:  [] as string[],
    yearsExperience: '',
    city:            '',
    phone:           '',
    memberLimit:     '10',
  })

  const set = (key: string, value: unknown) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  const toggleSpecialty = (s: string) => {
    const current = form.specialties
    if (current.includes(s)) {
      set('specialties', current.filter((x) => x !== s))
    } else if (current.length < 5) {
      set('specialties', [...current, s])
    }
  }

  const toggleCertification = (c: string) => {
    const current = form.certifications
    set('certifications', current.includes(c) ? current.filter((x) => x !== c) : [...current, c])
  }

  const validateStep1 = () => {
    const errs: Record<string, string> = {}
    if (!form.name.trim() || form.name.length < 2) errs.name = 'Le nom doit faire au moins 2 caractères'
    if (!form.email.includes('@')) errs.email = 'Email invalide'
    if (form.password.length < 8) errs.password = 'Le mot de passe doit faire au moins 8 caractères'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateStep2 = () => {
    const errs: Record<string, string> = {}
    if (form.bio.trim().length < 20) errs.bio = 'La bio doit faire au moins 20 caractères'
    if (form.specialties.length === 0) errs.specialties = 'Sélectionnez au moins une spécialité'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep2()) return
    setLoading(true)

    const res = await fetch('/api/auth/register/coach', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        ...form,
        yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : undefined,
        memberLimit:     Number(form.memberLimit) || 10,
      }),
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
      if (fieldErrors.email) setStep(1)
      setLoading(false)
      return
    }

    const result = await signIn('credentials', {
      email:    form.email,
      password: form.password,
      redirect: false,
    })

    if (result?.ok) {
      toast.success('Compte coach créé ! Bienvenue sur BodyOps')
      router.push('/coach/dashboard')
    } else {
      toast.error('Compte créé — connectez-vous manuellement')
      router.push('/auth/signin')
    }
  }

  return (
    <div className="relative min-h-screen text-white flex items-center justify-center px-4 py-12">
      <PageBackground showArtwork={false} />
      <div className="relative z-10 w-full max-w-lg">

        <div className="text-center mb-8">
          <div className="mb-6 flex justify-center">
            <Logo href="/" size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-white">Créer un compte coach</h1>
          <p className="text-sm text-zinc-400 mt-1">Étape {step} sur 3</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {([1, 2, 3] as const).map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-[#C8F135]' : 'bg-zinc-800'}`} />
          ))}
        </div>

        {/* Step 1 — credentials */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white">Informations de connexion</h2>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Prénom / Nom</label>
              <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
                placeholder="Marie Dupont"
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm" />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Adresse email professionnelle</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                placeholder="coach@example.com"
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm" />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Mot de passe</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={(e) => set('password', e.target.value)} placeholder="8 caractères minimum"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm" />
                <button type="button" onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
            </div>

            <button type="button" onClick={() => { if (validateStep1()) setStep(2) }}
              className="w-full py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-semibold text-sm hover:bg-[#d4f54d] transition-colors">
              Étape suivante
            </button>
          </div>
        )}

        {/* Step 2 — coach profile */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-base font-semibold text-white">Votre profil coach</h2>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Bio / Présentation <span className="text-zinc-500 font-normal">(min. 20 caractères)</span>
              </label>
              <textarea value={form.bio} onChange={(e) => set('bio', e.target.value)} rows={4}
                placeholder="Décrivez votre approche, votre philosophie d'entraînement et ce qui vous distingue des autres coachs…"
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm resize-none" />
              <p className="mt-1 text-xs text-zinc-500">{form.bio.length} / 1000 caractères</p>
              {errors.bio && <p className="text-xs text-red-400">{errors.bio}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Spécialités <span className="text-zinc-500 font-normal">(1–5 max)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map((s) => {
                  const active = form.specialties.includes(s)
                  return (
                    <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                      disabled={!active && form.specialties.length >= 5}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? 'border-[#C8F135] bg-[#C8F135]/10 text-[#C8F135]'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600 disabled:opacity-40'
                      }`}>
                      {active && <Check className="size-3 inline mr-1" />}{s}
                    </button>
                  )
                })}
              </div>
              {errors.specialties && <p className="mt-1 text-xs text-red-400">{errors.specialties}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Années d&apos;expérience</label>
                <input type="number" min="0" max="50" value={form.yearsExperience}
                  onChange={(e) => set('yearsExperience', e.target.value)} placeholder="5"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Clients max.</label>
                <input type="number" min="1" max="100" value={form.memberLimit}
                  onChange={(e) => set('memberLimit', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm" />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors">
                Retour
              </button>
              <button type="button" onClick={() => { if (validateStep2()) setStep(3) }}
                className="flex-1 py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-semibold text-sm hover:bg-[#d4f54d] transition-colors">
                Étape suivante
              </button>
            </div>
          </form>
        )}

        {/* Step 3 — optional details + submit */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-base font-semibold text-white">Informations complémentaires</h2>
            <p className="text-sm text-zinc-400">Ces informations sont optionnelles mais aident vos futurs clients à vous trouver.</p>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Diplômes & Certifications
              </label>
              <div className="flex flex-wrap gap-2">
                {CERTIFICATIONS.map((c) => {
                  const active = form.certifications.includes(c)
                  return (
                    <button key={c} type="button" onClick={() => toggleCertification(c)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? 'border-[#C8F135] bg-[#C8F135]/10 text-[#C8F135]'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                      }`}>
                      {active && <Check className="size-3 inline mr-1" />}{c}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Ville</label>
                <input type="text" value={form.city} onChange={(e) => set('city', e.target.value)}
                  placeholder="Paris"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Téléphone</label>
                <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)}
                  placeholder="+33 6 00 00 00 00"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors text-sm" />
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-400">
              <p className="font-medium text-zinc-300 mb-1">Récapitulatif</p>
              <ul className="space-y-1">
                <li>Nom : <span className="text-white">{form.name}</span></li>
                <li>Email : <span className="text-white">{form.email}</span></li>
                <li>Spécialités : <span className="text-white">{form.specialties.join(', ') || '—'}</span></li>
                <li>Expérience : <span className="text-white">{form.yearsExperience ? `${form.yearsExperience} ans` : '—'}</span></li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors">
                Retour
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-semibold text-sm hover:bg-[#d4f54d] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading
                  ? <span className="size-5 rounded-full border-2 border-zinc-600 border-t-zinc-900 animate-spin" />
                  : 'Créer mon compte coach'}
              </button>
            </div>
          </form>
        )}

        <div className="flex items-center justify-between mt-6">
          <Link href="/auth/register" className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            <ChevronLeft className="size-3" /> Changer de profil
          </Link>
          <Link href="/auth/signin" className="text-xs text-zinc-400 hover:text-[#C8F135] transition-colors">
            Déjà un compte ? Connexion
          </Link>
        </div>
      </div>
    </div>
  )
}
