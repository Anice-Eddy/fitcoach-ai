// Mention légale affiliation RGPD — toujours visible sur la page boutique

import { Info } from 'lucide-react'

export function AffiliateDisclosure() {
  return (
    <div className="flex items-start gap-2 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-xs text-zinc-400">
      <Info className="size-3.5 shrink-0 mt-0.5 text-zinc-500" />
      <p>
        <span className="font-medium text-zinc-300">Liens sponsorisés</span> — Certains liens de cette page sont des liens d&apos;affiliation.
        En cliquant, vous soutenez fitcoach sans frais supplémentaires.
        Nous percevons une commission sur les ventes.
      </p>
    </div>
  )
}
