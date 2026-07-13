'use client'

import { useEffect, useMemo, useState } from 'react'

export type MyCoachRelation = {
  relationId: string
  assignedAt: string
  coachProfileId: string
  coach: {
    id: string
    name: string | null
    email: string
    image: string | null
    firstName: string | null
    lastName: string | null
    bio: string | null
    avatarUrl: string | null
    specialties: string[]
    certifications: string[]
    yearsExperience: number | null
    publicRating: number | null
    publicRatingCount: number
    city: string | null
    memberLimit: number
  }
  nextAppointment: {
    id: string
    title: string
    scheduledAt: string
    duration: number
    status: string
    meetLink: string | null
  } | null
  totalAppointments: number
}

function coachDisplayName(relation: MyCoachRelation | null) {
  if (!relation) return null
  // Prefer the public account name, then the coach profile, then email as a fallback.
  const fullName = [relation.coach.firstName, relation.coach.lastName].filter(Boolean).join(' ')
  return relation.coach.name ?? (fullName || relation.coach.email)
}

/** Fetches the canonical coach relation from the API so UI panels never rely on stale local state. */
export function useMyCoach() {
  const [coaches, setCoaches] = useState<MyCoachRelation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Avoids setting state after navigation while the request is still in flight.
    let mounted = true
    fetch('/api/user/my-coach')
      .then(r => r.ok ? r.json() : { coaches: [] })
      .then((data) => {
        if (!mounted) return
        setCoaches(Array.isArray(data.coaches) ? data.coaches : [])
      })
      .catch(() => {
        if (mounted) setCoaches([])
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => { mounted = false }
  }, [])

  // The oldest relation is treated as the current coach for compact account panels.
  const primaryCoach = useMemo(() => coaches[0] ?? null, [coaches])

  return {
    coaches,
    loading,
    primaryCoach,
    hasCoach: coaches.length > 0,
    coachName: coachDisplayName(primaryCoach),
    nextAppointment: primaryCoach?.nextAppointment ?? null,
  }
}
