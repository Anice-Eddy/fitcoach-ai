import { describe, it, expect } from 'vitest'
import { PLANS, getPlanByPriceId, getPlanById } from '@/lib/stripe/plans'

describe('PLANS', () => {
  it('contient exactement 4 plans', () => {
    expect(PLANS).toHaveLength(4)
  })

  it('inclut le plan FREE avec price 0', () => {
    const free = PLANS.find((p) => p.plan === 'FREE')
    expect(free).toBeDefined()
    expect(free?.monthlyPrice).toBe(0)
  })

  it('inclut le plan PRO avec un prix mensuel > 0', () => {
    const pro = PLANS.find((p) => p.plan === 'PRO')
    expect(pro).toBeDefined()
    expect(pro?.monthlyPrice).toBeGreaterThan(0)
  })

  it('le prix annuel est inférieur au mensuel × 12', () => {
    const pro = PLANS.find((p) => p.plan === 'PRO')!
    expect(pro.yearlyPrice).toBeLessThan(pro.monthlyPrice * 12)
  })

  it('chaque plan a des features non vides', () => {
    for (const plan of PLANS) {
      expect(plan.features.length).toBeGreaterThan(0)
    }
  })

  it('exactement un plan est highlighted', () => {
    const highlighted = PLANS.filter((p) => p.highlighted)
    expect(highlighted).toHaveLength(1)
  })
})

describe('getPlanByPriceId', () => {
  it('retourne undefined pour un priceId inconnu', () => {
    expect(getPlanByPriceId('price_unknown_xyz')).toBeUndefined()
  })

  it('retourne undefined pour une chaîne vide', () => {
    expect(getPlanByPriceId('')).toBeUndefined()
  })
})

describe('getPlanById', () => {
  it('retourne le plan FREE par id', () => {
    const plan = getPlanById('free')
    expect(plan?.plan).toBe('FREE')
  })

  it('retourne le plan PRO par id', () => {
    const plan = getPlanById('pro')
    expect(plan?.plan).toBe('PRO')
  })

  it('retourne undefined pour un id inconnu', () => {
    expect(getPlanById('unknown_plan')).toBeUndefined()
  })
})
