import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── mocks ─────────────────────────────────────────────────────────────────────
vi.mock('@/lib/auth/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/affiliates/products', () => ({
  AFFILIATE_PRODUCTS: [
    {
      id: 'prod-supplement-whey', name: 'Test Whey', brand: 'Test', category: 'SUPPLEMENTS',
      affiliateUrl: 'https://example.com', imageUrl: null, price: 29.99,
      commissionRateMin: 3, commissionRateMax: 5, fitnessGoals: ['MUSCLE_GAIN'], tags: [],
    },
  ],
}))

vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    affiliateProduct: {
      upsert: vi.fn(),
    },
    affiliateClick: {
      create: vi.fn(),
    },
  },
}))

process.env.AUTH_SECRET = 'test-secret'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { POST } from '@/app/api/affiliates/track/route'

const mockProduct = {
  id:       'prod-supplement-whey',
  category: 'SUPPLEMENTS',
}

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/affiliates/track', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body:    JSON.stringify(body),
  })
}

describe('POST /api/affiliates/track', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(prisma.affiliateProduct.upsert as ReturnType<typeof vi.fn>).mockResolvedValue(mockProduct)
    ;(prisma.affiliateClick.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'click-1' })
  })

  it('returns 422 when productId is empty', async () => {
    const req = makeRequest({ productId: '' })
    const res = await POST(req)
    expect(res.status).toBe(422)
  })

  it('returns 404 when the product is not found', async () => {
    const req = makeRequest({ productId: 'prod-inexistant', source: 'shop' })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('returns { tracked: true } for a valid anonymous click', async () => {
    const req = makeRequest({ productId: 'prod-supplement-whey', source: 'shop' })
    const res = await POST(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.tracked).toBe(true)
  })

  it('returns { tracked: true } for a signed-in user', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1' } })
    const req = makeRequest({ productId: 'prod-supplement-whey', source: 'recommendation' })
    const res = await POST(req)
    const json = await res.json()
    expect(json.tracked).toBe(true)
    const createCall = (prisma.affiliateClick.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(createCall.data.userId).toBe('user-1')
  })

  it('stores an IP hash instead of the raw IP', async () => {
    const req = makeRequest(
      { productId: 'prod-supplement-whey', source: 'shop' },
      { 'x-forwarded-for': '192.168.1.1' },
    )
    await POST(req)
    const createCall = (prisma.affiliateClick.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(createCall.data.ipHash).not.toContain('192.168.1.1')
    expect(createCall.data.ipHash).toHaveLength(64) // sha256 hex
  })

  it('works without a source field', async () => {
    const req = makeRequest({ productId: 'prod-supplement-whey' })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })
})
