import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── mocks ─────────────────────────────────────────────────────────────────────
vi.mock('@/lib/auth/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    bodyMetric: {
      findMany: vi.fn(),
      create:   vi.fn(),
    },
  },
}))

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { GET, POST } from '@/app/api/user/metrics/route'

const mockMetrics = [
  { id: 'm1', userId: 'user-1', date: '2025-01-01T00:00:00.000Z', weightKg: 80 },
  { id: 'm2', userId: 'user-1', date: '2025-01-15T00:00:00.000Z', weightKg: 79 },
]

function makeGetRequest(params = '') {
  return new Request(`http://localhost/api/user/metrics${params}`, { method: 'GET' })
}

function makePostRequest(body: unknown) {
  return new Request('http://localhost/api/user/metrics', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

describe('GET /api/user/metrics', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue(null)
  })

  it('returns 401 when unauthenticated', async () => {
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(401)
  })

  it('returns the metrics list', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } })
    ;(prisma.bodyMetric.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockMetrics)
    const res  = await GET(makeGetRequest())
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json).toHaveLength(2)
  })

  it('respects the limit parameter', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } })
    ;(prisma.bodyMetric.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([mockMetrics[0]])
    await GET(makeGetRequest('?limit=1'))
    const findCall = (prisma.bodyMetric.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(findCall.take).toBe(1)
  })

  it('caps the limit at 365', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } })
    ;(prisma.bodyMetric.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])
    await GET(makeGetRequest('?limit=9999'))
    const findCall = (prisma.bodyMetric.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(findCall.take).toBe(365)
  })
})

describe('POST /api/user/metrics', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue(null)
  })

  it('returns 401 when unauthenticated', async () => {
    const res = await POST(makePostRequest({ weightKg: 80, date: '2025-01-01' }))
    expect(res.status).toBe(401)
  })

  it('returns 422 for invalid data with negative weight', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } })
    const res = await POST(makePostRequest({ weightKg: -5 }))
    expect(res.status).toBe(422)
  })

  it('creates a metric and returns 201', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } })
    ;(prisma.bodyMetric.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'm-new', userId: 'user-1', date: '2025-02-01T00:00:00.000Z', weightKg: 78,
    })
    const res  = await POST(makePostRequest({ weightKg: 78, date: '2025-02-01' }))
    const json = await res.json()
    expect(res.status).toBe(201)
    expect(json.weightKg).toBe(78)
  })

  it('associates the metric with the signed-in user', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-42' } })
    ;(prisma.bodyMetric.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'm-x', userId: 'user-42', date: '2025-03-01T00:00:00.000Z', weightKg: 75,
    })
    await POST(makePostRequest({ weightKg: 75, date: '2025-03-01' }))
    const createCall = (prisma.bodyMetric.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(createCall.data.userId).toBe('user-42')
  })
})
