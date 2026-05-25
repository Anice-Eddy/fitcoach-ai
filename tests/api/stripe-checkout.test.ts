import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── mocks ─────────────────────────────────────────────────────────────────────
vi.mock('@/lib/auth/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update:     vi.fn(),
    },
  },
}))

vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    customers: {
      create: vi.fn(),
    },
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
}))

process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.NEXTAUTH_SECRET     = 'test-secret'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { stripe } from '@/lib/stripe/client'
import { POST } from '@/app/api/stripe/checkout/route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/stripe/checkout', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

describe('POST /api/stripe/checkout', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'user-1', email: 'test@test.com', stripeCustomerId: null,
    })
    ;(prisma.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({})
    ;(stripe.customers.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'cus_test123' })
    ;(stripe.checkout.sessions.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      url: 'https://checkout.stripe.com/test',
    })
  })

  it('retourne 401 si non connecté', async () => {
    const req = makeRequest({ priceId: 'price_pro_month', interval: 'month' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('retourne 422 si priceId manquant', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com', name: 'Test' },
    })
    const req = makeRequest({ interval: 'month' })
    const res = await POST(req)
    expect(res.status).toBe(422)
  })

  it('retourne 422 si interval invalide', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com', name: 'Test' },
    })
    const req = makeRequest({ priceId: 'price_pro', interval: 'weekly' })
    const res = await POST(req)
    expect(res.status).toBe(422)
  })

  it('crée un customer Stripe si inexistant', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com', name: 'Test' },
    })
    const req = makeRequest({ priceId: 'price_pro_month', interval: 'month' })
    await POST(req)
    expect(stripe.customers.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@test.com' }),
    )
  })

  it('réutilise le customer Stripe existant', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com', name: 'Test' },
    })
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'user-1', email: 'test@test.com', stripeCustomerId: 'cus_existing',
    })
    const req = makeRequest({ priceId: 'price_pro_month', interval: 'month' })
    await POST(req)
    expect(stripe.customers.create).not.toHaveBeenCalled()
  })

  it('retourne une URL de checkout Stripe', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com', name: 'Test' },
    })
    const req  = makeRequest({ priceId: 'price_pro_month', interval: 'month' })
    const res  = await POST(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.url).toContain('stripe.com')
  })

  it('inclut un essai gratuit de 7 jours', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com', name: 'Test' },
    })
    const req = makeRequest({ priceId: 'price_pro_month', interval: 'month' })
    await POST(req)
    const createCall = (stripe.checkout.sessions.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(createCall.subscription_data.trial_period_days).toBe(7)
  })
})
