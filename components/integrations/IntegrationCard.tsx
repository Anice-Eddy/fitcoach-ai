'use client'
// Integration card: connection status and connect/disconnect button.

import Image from 'next/image'
import { Plug, Unplug, Clock } from 'lucide-react'
import type { IntegrationStatus } from '@/types'
import { toast } from 'sonner'
import { useLocale } from '@/contexts/LocaleContext'

interface Props { integration: IntegrationStatus }

/** Displays an integration's logo, connection status, last-sync time, and a connect/disconnect button; shows a "coming soon" toast for mocked integrations. */
export function IntegrationCard({ integration }: Props) {
  const { locale, t } = useLocale()

  const handleConnect = () => {
    toast.info(`${integration.label} — ${t('integrations.availableSoon')}`)
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
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">{t('integrations.soon')}</span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">{integration.description}</p>
        </div>
        <div className={`size-2.5 rounded-full mt-1 ${integration.isConnected ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
      </div>

      {integration.isConnected && integration.lastSyncedAt && (
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-3">
          <Clock className="size-3" />
          {t('integrations.sync')} {new Date(integration.lastSyncedAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
        </div>
      )}

      <button
        onClick={handleConnect}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          integration.isConnected
            ? 'bg-zinc-800 text-zinc-300 hover:bg-red-500/10 hover:text-red-400'
            : 'bg-zinc-800 text-white hover:bg-zinc-700'
        }`}
      >
        {integration.isConnected ? <Unplug className="size-3.5" /> : <Plug className="size-3.5" />}
        {integration.isConnected ? t('integrations.disconnect') : t('integrations.connect')}
      </button>
    </div>
  )
}
