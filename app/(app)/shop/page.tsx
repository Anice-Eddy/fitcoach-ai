'use client'

import { useState, useMemo } from 'react'
import { PageWrapper }          from '@/components/layout/PageWrapper'
import { Header }               from '@/components/layout/Header'
import { ProductCard }          from '@/components/affiliates/ProductCard'
import { CategoryFilter }       from '@/components/affiliates/CategoryFilter'
import { AffiliateDisclosure }  from '@/components/affiliates/AffiliateDisclosure'
import { AFFILIATE_PRODUCTS }   from '@/lib/affiliates/products'
import { ShoppingBag }          from 'lucide-react'
import { useUserStore }         from '@/stores/userStore'
import type { AffiliateCategory } from '@/types'

/** Affiliate shop page: displays product cards filtered by fitness goal or category, with affiliate click tracking. */
export default function ShopPage() {
  const [selected, setSelected] = useState<AffiliateCategory | 'ALL'>('ALL')
  const { profile }             = useUserStore()
  const userGoal                = profile?.fitnessGoal

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const p of AFFILIATE_PRODUCTS) {
      c[p.category] = (c[p.category] ?? 0) + 1
    }
    return c
  }, [])

  const filtered = useMemo(() => {
    let list = selected === 'ALL'
      ? AFFILIATE_PRODUCTS
      : AFFILIATE_PRODUCTS.filter((p) => p.category === selected)

    if (userGoal) {
      list = [...list].sort((a, b) => {
        const aMatch = a.fitnessGoals.includes(userGoal as never) ? -1 : 1
        const bMatch = b.fitnessGoals.includes(userGoal as never) ? -1 : 1
        return aMatch - bMatch
      })
    }
    return list
  }, [selected, userGoal])

  return (
    <>
      <Header title="Boutique" />
      <PageWrapper>
        <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Boutique</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Produits sélectionnés pour atteindre vos objectifs fitness.{' '}
            <span className="text-zinc-600">{AFFILIATE_PRODUCTS.length} produits</span>
          </p>
        </div>

        <AffiliateDisclosure />

        <CategoryFilter selected={selected} onChange={setSelected} counts={counts} />

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingBag className="size-10 text-zinc-600 mb-3" />
            <p className="text-zinc-400 font-medium">Aucun produit dans cette catégorie</p>
            <button
              onClick={() => setSelected('ALL')}
              className="mt-3 text-sm text-[#C8F135] hover:underline"
            >
              Voir tous les produits
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        </div>
      </PageWrapper>
    </>
  )
}
