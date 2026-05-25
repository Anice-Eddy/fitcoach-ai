import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── mocks ─────────────────────────────────────────────────────────────────────
vi.mock('@/lib/auth/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    profile: {
      findUnique: vi.fn(),
      upsert:     vi.fn(),
    },
  },
}))

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { GET, PATCH } from '@/app/api/user/profile/route'

const mockProfile = {
  id:            'profile-1',
  userId:        'user-1',
  firstName:     'Alice',
  age:           28,
  gender:        'FEMALE',
  weightKg:      60,
  heightCm:      165,
  activityLevel: 'MODERATELY_ACTIVE',
  fitnessGoal:   'WEIGHT_LOSS',
  fitnessLevel:  'INTERMEDIATE',
}

function makeRequest(body?: unknown) {
  return new Request('http://localhost/api/user/profile', {
    method:  body !== undefined ? 'PATCH' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body:    body !== undefined ? JSON.stringify(body) : undefined,
  })
}

describe('GET /api/user/profile', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue(null)
  })

  it('retourne 401 si non connecté', async () => {
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('retourne null (200) si aucun profil', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } })
    ;(prisma.profile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const res  = await GET()
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json).toBeNull()
  })

  it('retourne le profil si existant', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } })
    ;(prisma.profile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockProfile)
    const res  = await GET()
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.firstName).toBe('Alice')
  })
})

describe('PATCH /api/user/profile', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue(null)
  })

  it('retourne 401 si non connecté', async () => {
    const req = makeRequest({ firstName: 'Bob' })
    const res = await PATCH(req)
    expect(res.status).toBe(401)
  })

  it('retourne 422 si données invalides', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } })
    const req = makeRequest({ age: -1 })
    const res = await PATCH(req)
    expect(res.status).toBe(422)
  })

  it('upsert le profil avec des données valides', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } })
    ;(prisma.profile.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({ ...mockProfile, firstName: 'Bob' })
    const req  = makeRequest({ firstName: 'Bob' })
    const res  = await PATCH(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.firstName).toBe('Bob')
  })

  it('recalcule IMC/BMR si toutes les données physiques sont présentes', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } })
    ;(prisma.profile.upsert as ReturnType<typeof vi.fn>).mockResolvedValue(mockProfile)
    const req = makeRequest({
      weightKg:      70,
      heightCm:      175,
      age:           30,
      gender:        'MALE',
      activityLevel: 'MODERATELY_ACTIVE',
      fitnessGoal:   'MUSCLE_GAIN',
    })
    await PATCH(req)
    const upsertCall = (prisma.profile.upsert as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(upsertCall.update).toHaveProperty('bmi')
    expect(upsertCall.update).toHaveProperty('bmr')
    expect(upsertCall.update).toHaveProperty('tdee')
  })
})
