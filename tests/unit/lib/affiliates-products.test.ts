import { describe, it, expect } from 'vitest'
import { AFFILIATE_PRODUCTS, getProductsByCategory, getProductsByGoal } from '@/lib/affiliates/products'

describe('AFFILIATE_PRODUCTS', () => {
  it('contient exactement 20 produits', () => {
    expect(AFFILIATE_PRODUCTS).toHaveLength(20)
  })

  it('chaque produit a un id unique', () => {
    const ids = AFFILIATE_PRODUCTS.map((p) => p.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(AFFILIATE_PRODUCTS.length)
  })

  it('chaque produit a une catégorie valide', () => {
    const validCats = ['SUPPLEMENTS', 'EQUIPMENT', 'CLOTHING', 'BOOKS']
    for (const p of AFFILIATE_PRODUCTS) {
      expect(validCats).toContain(p.category)
    }
  })

  it('chaque produit a des taux de commission positifs', () => {
    for (const p of AFFILIATE_PRODUCTS) {
      expect(p.commissionRateMin).toBeGreaterThan(0)
      expect(p.commissionRateMax).toBeGreaterThanOrEqual(p.commissionRateMin)
    }
  })

  it('contient 5 suppléments', () => {
    expect(AFFILIATE_PRODUCTS.filter((p) => p.category === 'SUPPLEMENTS')).toHaveLength(5)
  })

  it('contient 5 équipements', () => {
    expect(AFFILIATE_PRODUCTS.filter((p) => p.category === 'EQUIPMENT')).toHaveLength(5)
  })

  it('contient 5 vêtements', () => {
    expect(AFFILIATE_PRODUCTS.filter((p) => p.category === 'CLOTHING')).toHaveLength(5)
  })

  it('contient 5 livres', () => {
    expect(AFFILIATE_PRODUCTS.filter((p) => p.category === 'BOOKS')).toHaveLength(5)
  })
})

describe('getProductsByCategory', () => {
  it('filtre les suppléments', () => {
    const sups = getProductsByCategory('SUPPLEMENTS')
    expect(sups.length).toBeGreaterThan(0)
    sups.forEach((p) => expect(p.category).toBe('SUPPLEMENTS'))
  })

  it('filtre les équipements', () => {
    const equip = getProductsByCategory('EQUIPMENT')
    expect(equip.length).toBeGreaterThan(0)
  })

  it('retourne un tableau vide pour une catégorie inconnue', () => {
    const result = getProductsByCategory('UNKNOWN')
    expect(result).toHaveLength(0)
  })
})

describe('getProductsByGoal', () => {
  it('retourne des produits pour MUSCLE_GAIN', () => {
    const prods = getProductsByGoal('MUSCLE_GAIN')
    expect(prods.length).toBeGreaterThan(0)
  })

  it('retourne des produits pour WEIGHT_LOSS', () => {
    const prods = getProductsByGoal('WEIGHT_LOSS')
    expect(prods.length).toBeGreaterThan(0)
  })

  it('chaque produit retourné correspond à l\'objectif', () => {
    const prods = getProductsByGoal('ENDURANCE')
    for (const p of prods) {
      expect(p.fitnessGoals).toContain('ENDURANCE')
    }
  })
})
