'use client'
// Page intégrations — connecteurs mockés + import Evolt manuel

import { PageWrapper }        from '@/components/layout/PageWrapper'
import { Header }             from '@/components/layout/Header'
import { IntegrationCard }    from '@/components/integrations/IntegrationCard'
import { EvoltImport }        from '@/components/integrations/EvoltImport'
import { useUserStore }       from '@/stores/userStore'
import { toast }              from 'sonner'
import type { IntegrationStatus } from '@/types'

const INTEGRATIONS: IntegrationStatus[] = [
  {
    id:          'google-fit',
    label:       'Google Fit',
    description: 'Synchronisez vos activités, pas et fréquence cardiaque.',
    logoSrc:     '/icons/google-fit.svg',
    isConnected: false,
    isMocked:    true,
    service:     'GOOGLE_FIT',
  },
  {
    id:          'strava',
    label:       'Strava',
    description: 'Importez vos courses, vélos et nagez depuis Strava.',
    logoSrc:     '/icons/strava.svg',
    isConnected: false,
    isMocked:    true,
    service:     'STRAVA',
  },
  {
    id:          'fitbit',
    label:       'Fitbit',
    description: 'Synchronisez sommeil, pas et données de santé.',
    logoSrc:     '/icons/fitbit.svg',
    isConnected: false,
    isMocked:    true,
    service:     'FITBIT',
  },
  {
    id:          'garmin',
    label:       'Garmin',
    description: 'Importez vos performances sportives depuis Garmin Connect.',
    logoSrc:     '/icons/garmin.svg',
    isConnected: false,
    isMocked:    true,
    service:     'GARMIN',
  },
  {
    id:          'apple-health',
    label:       'Apple Health',
    description: 'Import manuel de votre export JSON Apple Santé.',
    logoSrc:     '/icons/apple-health.svg',
    isConnected: false,
    isMocked:    true,
    service:     'APPLE_HEALTH',
  },
]

/** Integrations settings page: shows available third-party data integrations (e.g., Evolt Active) and handles import callbacks. */
export default function IntegrationsPage() {
  const { profile } = useUserStore()

  const handleEvoltImport = (data: { bodyFatPercent?: number; muscleMassKg?: number }) => {
    toast.success(`Evolt importé — Masse grasse : ${data.bodyFatPercent ?? '—'}%, Masse musculaire : ${data.muscleMassKg ?? '—'}kg`)
  }

  return (
    <>
      <Header title="Intégrations" />
      <PageWrapper>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Intégrations</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Connectez vos applications fitness pour synchroniser vos données automatiquement.
            </p>
          </div>

          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-300">
            🚧 Les intégrations OAuth (Google Fit, Strava, Fitbit, Garmin) arrivent prochainement.
            Import Evolt disponible dès maintenant.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {INTEGRATIONS.map((integration) => (
              <IntegrationCard key={integration.id} integration={integration} />
            ))}
          </div>

          <EvoltImport onImport={handleEvoltImport} />
        </div>
      </PageWrapper>
    </>
  )
}
