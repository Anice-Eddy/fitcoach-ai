'use client'
// Carte produit affilié — image, prix, commission, bouton d'achat tracké

import Image from 'next/image'
import { ExternalLink, Tag } from 'lucide-react'
import type { AffiliateProduct } from '@/types'
import { trackAffiliateClick } from '@/lib/affiliates/tracking'
import { getCategoryMeta } from '@/lib/affiliates/categories'

interface Props { product: AffiliateProduct }

export function ProductCard({ product }: Props) {
  const meta = getCategoryMeta(product.category)

  const handleClick = () => trackAffiliateClick(product.id, product.affiliateUrl)

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col hover:border-zinc-600 transition-colors">
      <div className="relative h-40 bg-zinc-800 flex items-center justify-center">
        <Image
          src={product.imageUrl ?? 'https://via.placeholder.com/200?text=Produit'}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 300px"
        />
        <span className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full bg-zinc-900/80 text-zinc-300">
          {meta?.emoji} {meta?.label}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="mb-1">
          <span className="text-xs text-zinc-500">{product.brand}</span>
          <h3 className="text-sm font-semibold text-white leading-tight">{product.name}</h3>
        </div>

        <p className="text-xs text-zinc-400 mb-3 flex-1">{product.description}</p>

        <div className="flex flex-wrap gap-1 mb-3">
          {product.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
              <Tag className="size-2.5" />{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-bold text-white">{product.price}$</span>
          <span className="text-xs text-[#C8F135] font-medium">
            {product.commissionRateMin}–{product.commissionRateMax}% comm.
          </span>
        </div>

        <button
          onClick={handleClick}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-[#C8F135] text-zinc-900 hover:bg-[#d4f54d] transition-colors"
        >
          <ExternalLink className="size-4" /> Voir le produit
        </button>
      </div>
    </div>
  )
}
