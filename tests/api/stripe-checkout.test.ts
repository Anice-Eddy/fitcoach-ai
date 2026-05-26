import { describe, it, expect } from 'vitest'
import { POST } from '@/app/api/stripe/checkout/route'

describe('POST /api/stripe/checkout', () => {
  it('retourne 503 (paiements désactivés temporairement)', async () => {
    const req = new Request('http://localhost/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId: 'price_pro_monthly', interval: 'month' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(503)
    const json = await res.json()
    expect(json.error).toBeDefined()
  })
})
