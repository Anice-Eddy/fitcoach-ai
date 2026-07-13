import { describe, it, expect } from 'vitest'
import { PLANS, getPlanByPriceId, getPlanById } from '@/lib/stripe/plans'

describe('PLANS', () => {
  it('contains exactly 4 plans', () => {
    expect(PLANS).toHaveLength(4)
  })

  it('includes the FREE plan with price 0', () => {
    const free = PLANS.find((p) => p.plan === 'FREE')
    expect(free).toBeDefined()
    expect(free?.monthlyPrice).toBe(0)
  })

  it('includes the PRO plan with a monthly price above 0', () => {
    const pro = PLANS.find((p) => p.plan === 'PRO')
    expect(pro).toBeDefined()
    expect(pro?.monthlyPrice).toBeGreaterThan(0)
  })

  it('keeps the yearly price below monthly price times 12', () => {
    const pro = PLANS.find((p) => p.plan === 'PRO')!
    expect(pro.yearlyPrice).toBeLessThan(pro.monthlyPrice * 12)
  })

  it('gives every plan non-empty features', () => {
    for (const plan of PLANS) {
      expect(plan.features.length).toBeGreaterThan(0)
    }
  })

  it('marks exactly one plan as highlighted', () => {
    const highlighted = PLANS.filter((p) => p.highlighted)
    expect(highlighted).toHaveLength(1)
  })
})

describe('getPlanByPriceId', () => {
  it('returns undefined for an unknown priceId', () => {
    expect(getPlanByPriceId('price_unknown_xyz')).toBeUndefined()
  })

  it('returns undefined for an empty string', () => {
    expect(getPlanByPriceId('')).toBeUndefined()
  })
})

describe('getPlanById', () => {
  it('returns the FREE plan by id', () => {
    const plan = getPlanById('free')
    expect(plan?.plan).toBe('FREE')
  })

  it('returns the PRO plan by id', () => {
    const plan = getPlanById('pro')
    expect(plan?.plan).toBe('PRO')
  })

  it('returns undefined for an unknown id', () => {
    expect(getPlanById('unknown_plan')).toBeUndefined()
  })
})
