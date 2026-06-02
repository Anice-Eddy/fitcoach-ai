'use client'

import { Suspense, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Star, Users, CheckCircle, ArrowLeft } from 'lucide-react'
import { ListSkeleton } from '@/components/ui/LoadingSkeleton'

interface Coach {
  id: string
  name: string | null
  image: string | null
  coachProfile: {
    id:              string
    bio:             string | null
    specialties:     string[]
    isVerified:      boolean
    city:            string | null
    country:         string | null
    yearsExperience: number | null
    _count: { coachMembers: number }
  }
}

/** Displays the public coach directory fetched from /api/coaches, with a search bar and coach cards. */
function CoachesInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const returnTo = searchParams?.get('returnTo') ?? ''
  // Only accept app-internal return targets to avoid open redirects and loops back to /choose.
  const safeReturnTo = returnTo.startsWith('/') && !returnTo.startsWith('//') && returnTo !== '/choose'
    ? returnTo
    : ''
  const returnQuery = safeReturnTo ? `?returnTo=${encodeURIComponent(safeReturnTo)}` : ''

  useEffect(() => {
    fetch('/api/coaches')
      .then(r => r.json())
      .then(data => { setCoaches(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const goBack = () => {
    // Prefer the explicit origin passed by settings/onboarding over browser history.
    // Do NOT use router.back() — it creates a loop when the user navigated here from
    // a coach detail page ("Choisir un autre coach" → /coaches → back → coach detail again).
    router.push(safeReturnTo || '/dashboard')
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-4xl px-4 py-12">

        <button
          type="button"
          onClick={goBack}
          className="mb-8 flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-white"
        >
          <ArrowLeft className="size-3.5" /> Retour
        </button>

        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[5px] text-[#C8F135]">
            Coaching humain
          </p>
          <h1 className="text-[32px] font-medium text-white">Choisissez votre coach</h1>
          <p className="mt-3 text-sm text-zinc-400">
            Des coachs certifiés disponibles pour un accompagnement personnalisé.
          </p>
        </div>

        {loading ? (
          <ListSkeleton rows={3} />
        ) : (
          <div className="space-y-5">
            {coaches.length === 0 && (
              <div className="rounded-2xl border border-[#C8F135]/30 bg-[#C8F135]/10 p-4 text-sm text-[#e8ff91]">
                Aucun coach réel n'est encore disponible.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {coaches.map(coach => (
                <Link
                  key={coach.id}
                  href={`/coaches/${coach.id}${returnQuery}`}
                  className="group rounded-2xl border border-zinc-800 bg-[#0b0d09] p-6 hover:border-zinc-600 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {coach.image ? (
                      <Image src={coach.image} alt={coach.name ?? ''} width={56} height={56} className="size-14 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="size-14 rounded-full bg-zinc-700 flex items-center justify-center text-xl font-bold text-white shrink-0">
                        {getInitials(coach.name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-white truncate">{coach.name ?? 'Coach'}</h2>
                        {coach.coachProfile.isVerified && (
                          <CheckCircle className="size-4 text-[#C8F135] shrink-0" />
                        )}
                      </div>
                      {coach.coachProfile.specialties.length > 0 && (
                        <p className="text-xs text-zinc-400 mt-0.5 truncate">
                          {coach.coachProfile.specialties.join(' · ')}
                        </p>
                      )}
                      {coach.coachProfile.bio && (
                        <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{coach.coachProfile.bio}</p>
                      )}
                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                          <Users className="size-3" />
                          {coach.coachProfile._count.coachMembers} membre{coach.coachProfile._count.coachMembers !== 1 ? 's' : ''}
                        </div>
                        {(coach.coachProfile.city || coach.coachProfile.country) && (
                          <span className="text-xs text-zinc-500">
                            📍 {[coach.coachProfile.city, coach.coachProfile.country].filter(Boolean).join(', ')}
                          </span>
                        )}
                        {coach.coachProfile.yearsExperience != null && (
                          <span className="text-xs text-zinc-500">
                            🏅 {coach.coachProfile.yearsExperience} ans
                          </span>
                        )}
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`size-3 ${i < 4 ? 'fill-[#C8F135] text-[#C8F135]' : 'text-zinc-700'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Entretien découverte · 30 min · Gratuit</span>
                    <span className="text-xs text-[#C8F135] group-hover:underline">Réserver →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default function CoachesPage() {
  return (
    <Suspense fallback={<div className="p-8"><ListSkeleton /></div>}>
      <CoachesInner />
    </Suspense>
  )
}
