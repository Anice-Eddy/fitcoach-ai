'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { PageWrapper }         from '@/components/layout/PageWrapper'
import { Header }              from '@/components/layout/Header'
import { AffiliateDisclosure } from '@/components/affiliates/AffiliateDisclosure'
import { AFFILIATE_CATEGORIES } from '@/lib/affiliates/categories'
import { getAffiliateProductsForMarket } from '@/lib/affiliates/products'
import { ChevronRight, Search, X, ExternalLink } from 'lucide-react'
import type { AffiliateMarket, AffiliateCategory, AffiliateProduct } from '@/types'

const CATEGORY_STYLE: Record<AffiliateCategory, { iconBg: string; iconColor: string }> = {
  SUPPLEMENTS: { iconBg: 'bg-[#C8F135]/15', iconColor: 'text-[#C8F135]'       },
  EQUIPMENT:   { iconBg: 'bg-sky-500/15',   iconColor: 'text-sky-400'          },
  CLOTHING:    { iconBg: 'bg-violet-500/15', iconColor: 'text-violet-400'      },
  BOOKS:       { iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400'        },
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

const CATEGORY_LABEL: Record<AffiliateCategory, string> = {
  SUPPLEMENTS: 'Suppléments',
  EQUIPMENT:   'Équipement',
  CLOTHING:    'Vêtements',
  BOOKS:       'Livres',
}

export default function ShopPage() {
  const [market,  setMarket]  = useState<AffiliateMarket>('FR')
  const [query,   setQuery]   = useState('')

  useEffect(() => { setMarket(detectMarket()) }, [])

  const changeMarket = (m: AffiliateMarket) => {
    setMarket(m)
    window.localStorage.setItem(MARKET_KEY, m)
  }

  const products = useMemo(() => getAffiliateProductsForMarket(market), [market])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const p of products) c[p.category] = (c[p.category] ?? 0) + 1
    return c
  }, [products])

  const searchResults = useMemo<AffiliateProduct[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q),
    ).slice(0, 12)
  }, [query, products])

  const isSearching = query.trim().length > 0

  return (
    <>
      <Header title="Boutique" />
      <PageWrapper>
        <div className="space-y-6">

          {/* Page header */}
          <div>
            <h1 className="text-2xl font-bold text-white">Boutique</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Produits sélectionnés pour atteindre vos objectifs fitness.{' '}
              <span className="text-zinc-600">{products.length} produits · {market === 'CA' ? 'Canada' : 'France'}</span>
            </p>
          </div>

          {/* ── Barre de recherche ─────────────────────────────── */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-500 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher un produit, une marque…"
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 pl-11 pr-10 py-3.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-[#C8F135] transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* ── Résultats de recherche ─────────────────────────── */}
          {isSearching ? (
            <div className="space-y-3">
              <p className="text-xs text-zinc-500">
                {searchResults.length > 0
                  ? `${searchResults.length} résultat${searchResults.length > 1 ? 's' : ''} pour « ${query} »`
                  : `Aucun résultat pour « ${query} »`
                }
              </p>
              {searchResults.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
                  <Search className="size-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400">Aucun produit trouvé</p>
                  <p className="text-xs text-zinc-600 mt-1">Essaie un autre terme de recherche</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map(product => (
                    <a
                      key={product.id}
                      href={product.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-3 hover:border-[#C8F135]/40 hover:bg-zinc-800 transition-all group"
                    >
                      {product.imageUrl && (
                        <div className="relative size-16 shrink-0 rounded-xl overflow-hidden bg-zinc-800">
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-contain p-1"
                            sizes="64px"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-white leading-snug line-clamp-2">
                            {product.name}
                          </p>
                          <ExternalLink className="size-3.5 text-zinc-600 group-hover:text-[#C8F135] transition-colors shrink-0 mt-0.5" />
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {product.brand && <span className="text-zinc-400">{product.brand} · </span>}
                          {CATEGORY_LABEL[product.category as AffiliateCategory]}
                        </p>
                        {product.price && (
                          <p className="text-xs text-[#C8F135] font-semibold mt-1">{product.price.toFixed(2)} €</p>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ── Vue catégories (défaut) ──────────────────────── */
            <>
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

              {/* Category cards */}
              <div className="grid grid-cols-2 gap-4">
                {AFFILIATE_CATEGORIES.map((cat) => {
                  const Icon  = cat.icon
                  const count = counts[cat.id] ?? 0
                  const style = CATEGORY_STYLE[cat.id]
                  return (
                    <Link
                      key={cat.id}
                      href={`/shop/${cat.id.toLowerCase()}`}
                      className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center transition-all hover:border-[#C8F135]/40 hover:bg-zinc-800"
                    >
                      <div className={`flex size-14 items-center justify-center rounded-2xl transition-colors ${style.iconBg}`}>
                        <Icon className={`size-7 transition-colors ${style.iconColor}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{cat.label}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{count} produits</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-zinc-500 group-hover:text-[#C8F135] transition-colors">
                        Voir <ChevronRight className="size-3.5" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </>
          )}

        </div>
      </PageWrapper>
    </>
  )
}
