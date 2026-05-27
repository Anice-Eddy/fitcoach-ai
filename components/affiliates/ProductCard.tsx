'use client'

import { useState } from 'react'
import { ExternalLink, Tag } from 'lucide-react'
import type { AffiliateProduct } from '@/types'
import { trackAffiliateClick } from '@/lib/affiliates/tracking'
import { getCategoryMeta } from '@/lib/affiliates/categories'

interface Props { product: AffiliateProduct }

/** Renders an affiliate product card with image (with fallback emoji), tags, and an Amazon external link that fires a tracking event on click. */
export function ProductCard({ product }: Props) {
  const meta = getCategoryMeta(product.category)
  const [imgError, setImgError] = useState(false)

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col hover:border-zinc-600 transition-colors group">

      {/* Image / category banner */}
      <div className="relative h-40 bg-zinc-800 overflow-hidden flex items-center justify-center">
        {product.imageUrl && !imgError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <span className="text-6xl select-none">{meta?.emoji ?? '📦'}</span>
        )}
        {/* Category chip */}
        <span className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full bg-zinc-900/80 text-zinc-300 backdrop-blur-sm">
          {meta?.emoji} {meta?.label}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="mb-2 flex-1">
          <h3 className="text-sm font-semibold text-white leading-tight">{product.name}</h3>
          {product.description && (
            <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{product.description}</p>
          )}
        </div>

        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                <Tag className="size-2.5" />{tag}
              </span>
            ))}
          </div>
        )}

        <p className="text-xs text-zinc-500 mb-3">Voir le prix sur Amazon</p>

        {/* <a> tag — never blocked by popup blockers, works on all devices */}
        <a
          href={product.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackAffiliateClick(product.id)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-[#C8F135] text-zinc-900 hover:bg-[#d4f54d] transition-colors"
        >
          <ExternalLink className="size-4" /> Voir sur Amazon
        </a>
      </div>
    </div>
  )
}
