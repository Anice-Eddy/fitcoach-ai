'use client'
// Page boutique affiliée — filtrage par catégorie + grille de produits

import { useState, useMemo } from 'react'
import { PageWrapper }          from '@/components/layout/PageWrapper'
import { ProductCard }          from '@/components/affiliates/ProductCard'
import { CategoryFilter }       from '@/components/affiliates/CategoryFilter'
import { AffiliateDisclosure }  from '@/components/affiliates/AffiliateDisclosure'
import { EmptyState }           from '@/components/ui/EmptyState'
import { AFFILIATE_PRODUCTS }   from '@/lib/affiliates/products'
import { ShoppingBag }          from 'lucide-react'
import { useUserStore }         from '@/stores/userStore'
import type { AffiliateCategory } from '@/types'

export default function ShopPage() {
  const [selected, setSelected] = useState<AffiliateCategory | 'ALL'>('ALL')
  const { profile }             = useUserStore()

  const userGoal = profile?.fitnessGoal

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const p of AFFILIATE_PRODUCTS) {
      c[p.category] = (c[p.category] ?? 0) + 1
    }
    return c
  }, [])

  const filtered = useMemo(() => {
    let list = selected === 'ALL' ? AFFILIATE_PRODUCTS : AFFILIATE_PRODUCTS.filter((p) => p.category === selected)
    // Produits pertinents pour l'objectif de l'utilisateur en premier
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
    <PageWrapper>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Boutique</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Produits sélectionnés pour atteindre vos objectifs fitness.
          </p>
        </div>

        <AffiliateDisclosure />

        <CategoryFilter selected={selected} onChange={setSelected} counts={counts} />

        {filtered.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="size-8" />}
            title="Aucun produit"
            description="Sélectionnez une autre catégorie."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
