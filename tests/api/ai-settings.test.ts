import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    profile: {
      findUnique: vi.fn(),
      update:     vi.fn(),
    },
  },
}))

import { auth }   from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { GET, PATCH } from '@/app/api/ai/settings/route'

const mockSession = { user: { id: 'user-1' } }
const mockProfile = { aiMemoryEnabled: true, aiHistoryEnabled: true }

function makeRequest(body?: unknown) {
  return new Request('http://localhost/api/ai/settings', {
    method:  body ? 'PATCH' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body:    body ? JSON.stringify(body) : undefined,
  })
}

describe('GET /api/ai/settings', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession)
    ;(prisma.profile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockProfile)
  })

  it('retourne 401 si non authentifié', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('retourne les settings IA du profil', async () => {
    const res  = await GET()
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.aiMemoryEnabled).toBe(true)
    expect(json.aiHistoryEnabled).toBe(true)
  })

  it('retourne 404 si pas de profil', async () => {
    ;(prisma.profile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/ai/settings', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession)
    ;(prisma.profile.update as ReturnType<typeof vi.fn>).mockResolvedValue({ aiMemoryEnabled: false, aiHistoryEnabled: true })
  })

  it('retourne 401 si non authentifié', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const res = await PATCH(makeRequest({ aiMemoryEnabled: false }))
    expect(res.status).toBe(401)
  })

  it('met à jour aiMemoryEnabled', async () => {
    const res  = await PATCH(makeRequest({ aiMemoryEnabled: false }))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.aiMemoryEnabled).toBe(false)
    const updateCall = (prisma.profile.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(updateCall.data.aiMemoryEnabled).toBe(false)
  })

  it('retourne 422 si le body est invalide', async () => {
    const res = await PATCH(makeRequest({ aiMemoryEnabled: 'oui' }))
    expect(res.status).toBe(422)
  })
})
