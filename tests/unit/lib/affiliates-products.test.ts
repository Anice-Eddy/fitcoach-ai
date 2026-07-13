import { describe, it, expect } from 'vitest'
import { AFFILIATE_PRODUCTS, getProductsByCategory, getProductsByGoal } from '@/lib/affiliates/products'

describe('AFFILIATE_PRODUCTS', () => {
  it('contains exactly 49 products', () => {
    expect(AFFILIATE_PRODUCTS).toHaveLength(49)
  })

  it('gives every product a unique id', () => {
    const ids = AFFILIATE_PRODUCTS.map((p) => p.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(AFFILIATE_PRODUCTS.length)
  })

  it('gives every product a valid category', () => {
    const validCats = ['SUPPLEMENTS', 'EQUIPMENT', 'CLOTHING', 'BOOKS']
    for (const p of AFFILIATE_PRODUCTS) {
      expect(validCats).toContain(p.category)
    }
  })

  it('gives every product positive commission rates', () => {
    for (const p of AFFILIATE_PRODUCTS) {
      expect(p.commissionRateMin).toBeGreaterThan(0)
      expect(p.commissionRateMax).toBeGreaterThanOrEqual(p.commissionRateMin)
    }
  })

  it('contains 24 supplements', () => {
    expect(AFFILIATE_PRODUCTS.filter((p) => p.category === 'SUPPLEMENTS')).toHaveLength(24)
  })

  it('contains 14 equipment products', () => {
    expect(AFFILIATE_PRODUCTS.filter((p) => p.category === 'EQUIPMENT')).toHaveLength(14)
  })

  it('contains at least 1 clothing product', () => {
    expect(AFFILIATE_PRODUCTS.filter((p) => p.category === 'CLOTHING').length).toBeGreaterThanOrEqual(1)
  })

  it('contains 10 books', () => {
    expect(AFFILIATE_PRODUCTS.filter((p) => p.category === 'BOOKS')).toHaveLength(10)
  })
})

describe('getProductsByCategory', () => {
  it('filters supplements', () => {
    const sups = getProductsByCategory('SUPPLEMENTS')
    expect(sups.length).toBeGreaterThan(0)
    sups.forEach((p) => expect(p.category).toBe('SUPPLEMENTS'))
  })

  it('filters equipment', () => {
    const equip = getProductsByCategory('EQUIPMENT')
    expect(equip.length).toBeGreaterThan(0)
  })

  it('returns an empty array for an unknown category', () => {
    const result = getProductsByCategory('UNKNOWN')
    expect(result).toHaveLength(0)
  })
})

describe('getProductsByGoal', () => {
  it('returns products for MUSCLE_GAIN', () => {
    const prods = getProductsByGoal('MUSCLE_GAIN')
    expect(prods.length).toBeGreaterThan(0)
  })

  it('returns products for WEIGHT_LOSS', () => {
    const prods = getProductsByGoal('WEIGHT_LOSS')
    expect(prods.length).toBeGreaterThan(0)
  })

  it('returns only products that match the goal', () => {
    const prods = getProductsByGoal('ENDURANCE')
    for (const p of prods) {
      expect(p.fitnessGoals).toContain('ENDURANCE')
    }
  })
})
