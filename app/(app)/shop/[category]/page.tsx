'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageWrapper }         from '@/components/layout/PageWrapper'
import { Header }              from '@/components/layout/Header'
import { ProductCard }         from '@/components/affiliates/ProductCard'
import { AffiliateDisclosure } from '@/components/affiliates/AffiliateDisclosure'
import { AFFILIATE_CATEGORIES } from '@/lib/affiliates/categories'
import { getAffiliateProductsForMarket } from '@/lib/affiliates/products'
import { useUserStore }        from '@/stores/userStore'
import { ChevronLeft, ShoppingBag } from 'lucide-react'
import type { AffiliateCategory, AffiliateMarket } from '@/types'

const SLUG_TO_CAT: Record<string, AffiliateCategory> = {
  supplements: 'SUPPLEMENTS',
  equipment:   'EQUIPMENT',
  clothing:    'CLOTHING',
  books:       'BOOKS',
}

const MARKET_KEY = 'BodyOps:shop-market'

function detectMarket(): AffiliateMarket {
  if (typeof window === 'undefined') return 'FR'
  const stored = window.localStorage.getItem(MARKET_KEY)
  if (stored === 'FR' || stored === 'CA') return stored
  const locale   = navigator.language.toLowerCase()
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone.toLowerCase()
  return locale.includes('-ca') || timezone.includes('toronto') || timezone.includes('montreal') || timezone.includes('vancouver')
    ? 'CA' : 'FR'
}

export default function CategoryPage() {
  const params     = useParams()
  const router     = useRouter()
  const { profile } = useUserStore()
  const slug       = ((params?.category as string) ?? '').toLowerCase()
  const categoryId = SLUG_TO_CAT[slug]
  const meta       = AFFILIATE_CATEGORIES.find((c) => c.id === categoryId)

  const [market, setMarket] = useState<AffiliateMarket>('FR')

  useEffect(() => {
    if (!categoryId) { router.replace('/shop'); return }
    setMarket(detectMarket())
  }, [categoryId, router])

  const changeMarket = (m: AffiliateMarket) => {
    setMarket(m)
    window.localStorage.setItem(MARKET_KEY, m)
  }

  const products = useMemo(() => {
    if (!categoryId) return []
    const all = getAffiliateProductsForMarket(market)
    let list  = all.filter((p) => p.category === categoryId)

    // Sort by user fitness goal relevance
    const goal = profile?.fitnessGoal
    if (goal) {
      list = [...list].sort((a, b) => {
        const aM = a.fitnessGoals.includes(goal as never) ? -1 : 1
        const bM = b.fitnessGoals.includes(goal as never) ? -1 : 1
        return aM - bM
      })
    }
    return list
  }, [categoryId, market, profile?.fitnessGoal])

  if (!meta) return null

  const Icon = meta.icon

  return (
    <>
      <Header title={meta.label} />
      <PageWrapper>
        <div className="space-y-6">

          {/* Back + category header */}
          <div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors mb-4"
            >
              <ChevronLeft className="size-4" /> Toutes les catégories
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#C8F135]/10">
                <Icon className="size-5 text-[#C8F135]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{meta.label}</h1>
                <p className="text-xs text-zinc-500">{products.length} produits · {market === 'CA' ? 'Canada' : 'France'}</p>
              </div>
            </div>
          </div>

          {/* Market toggle */}
          <div className="inline-flex rounded-xl border border-zinc-800 bg-zinc-900 p-1">
            {(['FR', 'CA'] as AffiliateMarket[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => changeMarket(m)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  market === m ? 'bg-[#C8F135] text-zinc-950' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {m === 'FR' ? 'France' : 'Canada'}
              </button>
            ))}
          </div>

          <AffiliateDisclosure />

          {/* Products */}
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag className="size-10 text-zinc-600 mb-3" />
              <p className="text-zinc-400 font-medium">Aucun produit dans cette catégorie</p>
              <Link href="/shop" className="mt-3 text-sm text-[#C8F135] hover:underline">
                Voir toutes les catégories
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

        </div>
      </PageWrapper>
    </>
  )
}
