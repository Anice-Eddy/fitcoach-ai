'use client'

import { useEffect, useState, useMemo } from 'react'
import { PageWrapper }          from '@/components/layout/PageWrapper'
import { Header }               from '@/components/layout/Header'
import { ProductCard }          from '@/components/affiliates/ProductCard'
import { CategoryFilter }       from '@/components/affiliates/CategoryFilter'
import { AffiliateDisclosure }  from '@/components/affiliates/AffiliateDisclosure'
import { getAffiliateProductsForMarket } from '@/lib/affiliates/products'
import { ShoppingBag }          from 'lucide-react'
import { useUserStore }         from '@/stores/userStore'
import type { AffiliateCategory, AffiliateMarket } from '@/types'

const MARKET_STORAGE_KEY = 'BodyOps:shop-market'

// Detects the most likely shop market from browser locale/timezone; manual choice still wins.
function detectMarket(): AffiliateMarket {
  if (typeof window === 'undefined') return 'FR'
  const stored = window.localStorage.getItem(MARKET_STORAGE_KEY)
  if (stored === 'FR' || stored === 'CA') return stored

  const locale = navigator.language.toLowerCase()
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone.toLowerCase()
  return locale.includes('-ca') || timezone.includes('toronto') || timezone.includes('montreal') || timezone.includes('vancouver')
    ? 'CA'
    : 'FR'
}

/** Affiliate shop page: displays product cards filtered by fitness goal or category, with affiliate click tracking. */
export default function ShopPage() {
  const [selected, setSelected] = useState<AffiliateCategory | 'ALL'>('ALL')
  const [market, setMarket] = useState<AffiliateMarket>('FR')
  const { profile }             = useUserStore()
  const userGoal                = profile?.fitnessGoal
  const products                = useMemo(() => getAffiliateProductsForMarket(market), [market])

  useEffect(() => {
    setMarket(detectMarket())
  }, [])

  const changeMarket = (nextMarket: AffiliateMarket) => {
    setMarket(nextMarket)
    window.localStorage.setItem(MARKET_STORAGE_KEY, nextMarket)
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const p of products) {
      c[p.category] = (c[p.category] ?? 0) + 1
    }
    return c
  }, [products])

  const filtered = useMemo(() => {
    let list = selected === 'ALL'
      ? products
      : products.filter((p) => p.category === selected)

    if (userGoal) {
      list = [...list].sort((a, b) => {
        const aMatch = a.fitnessGoals.includes(userGoal as never) ? -1 : 1
        const bMatch = b.fitnessGoals.includes(userGoal as never) ? -1 : 1
        return aMatch - bMatch
      })
    }
    return list
  }, [products, selected, userGoal])

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
            <span className="text-zinc-600">{products.length} produits · {market === 'CA' ? 'Canada' : 'France'}</span>
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          {([
            { value: 'FR' as const, label: 'France' },
            { value: 'CA' as const, label: 'Canada' },
          ]).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => changeMarket(option.value)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                market === option.value
                  ? 'bg-[#C8F135] text-zinc-950'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
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
