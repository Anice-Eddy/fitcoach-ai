'use client'

import { PageWrapper }            from '@/components/layout/PageWrapper'
import { Header }                 from '@/components/layout/Header'
import { IntegrationCard }        from '@/components/integrations/IntegrationCard'
import { AppleHealthShortcut }    from '@/components/integrations/AppleHealthShortcut'
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
    id:          'myfitnesspal',
    label:       'MyFitnessPal',
    description: 'Préparez la synchro calories, macros et litres d\'eau depuis MyFitnessPal.',
    logoSrc:     '/icons/myfitnesspal.svg',
    isConnected: false,
    isMocked:    true,
    service:     'MYFITNESSPAL',
  },
]

export default function IntegrationsPage() {
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

          {/* Apple Health — fonctionnel */}
          <AppleHealthShortcut />

          {/* Autres intégrations OAuth — prochainement */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Prochainement</p>
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-300 mb-4">
              🚧 Les intégrations OAuth (Google Fit, Strava, Fitbit, Garmin, MyFitnessPal) arrivent prochainement.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {INTEGRATIONS.map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>
          </div>
        </div>
      </PageWrapper>
    </>
  )
}
