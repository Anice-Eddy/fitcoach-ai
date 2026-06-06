import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    user: {
      findMany:   vi.fn(),
      findUnique: vi.fn(),
      create:     vi.fn(),
    },
    coachProfile: {
      findUnique: vi.fn(),
      update:     vi.fn(),
    },
  },
}))
vi.mock('bcryptjs', () => ({
  hash: vi.fn(async () => 'hashed-password'),
}))

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { GET as getCoaches } from '@/app/api/coaches/route'
import { GET as getCoach } from '@/app/api/coaches/[coachId]/route'
import { PATCH as patchSettings } from '@/app/api/coach/settings/route'
import { POST as registerCoach } from '@/app/api/auth/register/coach/route'

const publicProfile = {
  id: 'coach-profile-1',
  bio: 'Coach force et nutrition.',
  specialties: ['Musculation'],
  certifications: ['BPJEPS'],
  isVerified: true,
  city: 'Paris',
  country: 'France',
  yearsExperience: 8,
  avatarUrl: null,
  showMemberCount: false,
  showYearsExperience: false,
  publicRating: 4.8,
  publicRatingCount: 24,
  showPublicRating: false,
  discoveryCallEnabled: true,
  discoveryCallTitle: 'Entretien découverte',
  discoveryCallDuration: 30,
  showDiscoveryCall: false,
  _count: { coachMembers: 12, appointments: 5 },
}

function jsonReq(body: unknown) {
  return new Request('http://localhost/api/test', {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

describe('coach public visibility settings', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('masque les informations désactivées dans la liste publique des coachs', async () => {
    ;(prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{
      id: 'coach-user-1',
      name: 'Coach Alex',
      image: null,
      coachProfile: publicProfile,
    }])

    const res = await getCoaches()
    const json = await res.json()

    expect(json[0].coachProfile.yearsExperience).toBeNull()
    expect(json[0].coachProfile.publicRating).toBeNull()
    expect(json[0].coachProfile.discoveryCallTitle).toBeNull()
    expect(json[0].coachProfile._count.coachMembers).toBeNull()
  })

  it('masque les informations désactivées sur le détail public du coach', async () => {
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'coach-user-1',
      name: 'Coach Alex',
      image: null,
      coachProfile: publicProfile,
    })

    const res = await getCoach(new Request('http://localhost/api/coaches/coach-user-1') as never, {
      params: { coachId: 'coach-user-1' },
    })
    const json = await res.json()

    expect(json.coachProfile.yearsExperience).toBeNull()
    expect(json.coachProfile.publicRating).toBeNull()
    expect(json.coachProfile.discoveryCallDuration).toBeNull()
    expect(json.coachProfile._count.coachMembers).toBeNull()
    expect(json.coachProfile._count.appointments).toBe(5)
  })

  it('enregistre les réglages de visibilité du coach', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'coach-user-1' } })
    ;(prisma.coachProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'coach-profile-1' })
    ;(prisma.coachProfile.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'coach-profile-1' })

    const res = await patchSettings(jsonReq({
      showMemberCount: false,
      showYearsExperience: false,
      publicRating: 4.7,
      publicRatingCount: 12,
      showPublicRating: true,
      discoveryCallEnabled: true,
      discoveryCallTitle: 'Appel découverte',
      discoveryCallDuration: 30,
      showDiscoveryCall: true,
    }))

    expect(res.status).toBe(200)
    expect(prisma.coachProfile.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        showMemberCount: false,
        showYearsExperience: false,
        publicRating: 4.7,
        publicRatingCount: 12,
        showPublicRating: true,
        discoveryCallTitle: 'Appel découverte',
        discoveryCallDuration: 30,
      }),
    }))
  })

  it('accepte la durée de l’entretien découverte envoyée depuis un champ texte', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'coach-user-1' } })
    ;(prisma.coachProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'coach-profile-1' })
    ;(prisma.coachProfile.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'coach-profile-1' })

    const res = await patchSettings(jsonReq({
      discoveryCallTitle: 'Entretien découverte',
      discoveryCallDuration: '45',
      showDiscoveryCall: true,
    }))

    expect(res.status).toBe(200)
    expect(prisma.coachProfile.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ discoveryCallDuration: 45 }),
    }))
  })

  it('crée un compte coach avec les nouveaux champs publics', async () => {
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'coach-user-1' })

    const res = await registerCoach(jsonReq({
      name: 'Coach Alex',
      email: 'alex@example.com',
      password: 'password123',
      bio: 'Coach certifie specialise en force et transformation physique.',
      specialties: ['Musculation'],
      certifications: ['BPJEPS'],
      yearsExperience: 6,
      memberLimit: 20,
      showMemberCount: false,
      showYearsExperience: true,
      publicRating: 4.9,
      publicRatingCount: 30,
      showPublicRating: true,
      discoveryCallEnabled: true,
      discoveryCallTitle: 'Entretien découverte',
      discoveryCallDuration: 30,
      showDiscoveryCall: true,
    }))

    expect(res.status).toBe(201)
    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        coachProfile: {
          create: expect.objectContaining({
            showMemberCount: false,
            publicRating: 4.9,
            publicRatingCount: 30,
            showPublicRating: true,
            discoveryCallDuration: 30,
          }),
        },
      }),
    }))
  })
})
