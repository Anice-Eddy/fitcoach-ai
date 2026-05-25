'use client'
// Carte d'intégration — statut connexion + bouton connect/disconnect

import Image from 'next/image'
import { Plug, Unplug, Lock, Clock } from 'lucide-react'
import type { IntegrationStatus } from '@/types'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { toast } from 'sonner'

interface Props { integration: IntegrationStatus }

export function IntegrationCard({ integration }: Props) {
  const { isPro } = useSubscriptionStore()
  const canUse    = isPro()

  const handleConnect = () => {
    if (!canUse) { toast.info('Disponible avec le plan Pro'); return }
    toast.info(`${integration.label} — disponible prochainement`)
  }

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center p-1.5">
          <Image src={integration.logoSrc} alt={integration.label} width={28} height={28} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">{integration.label}</h3>
            {integration.isMocked && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Bientôt</span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">{integration.description}</p>
        </div>
        <div className={`size-2.5 rounded-full mt-1 ${integration.isConnected ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
      </div>

      {integration.isConnected && integration.lastSyncedAt && (
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-3">
          <Clock className="size-3" />
          Sync {new Date(integration.lastSyncedAt).toLocaleDateString('fr-FR')}
        </div>
      )}

      <button
        onClick={handleConnect}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          !canUse
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            : integration.isConnected
            ? 'bg-zinc-800 text-zinc-300 hover:bg-red-500/10 hover:text-red-400'
            : 'bg-zinc-800 text-white hover:bg-zinc-700'
        }`}
      >
        {!canUse ? <Lock className="size-3.5" /> : integration.isConnected ? <Unplug className="size-3.5" /> : <Plug className="size-3.5" />}
        {!canUse ? 'Pro requis' : integration.isConnected ? 'Déconnecter' : 'Connecter'}
      </button>
    </div>
  )
}
