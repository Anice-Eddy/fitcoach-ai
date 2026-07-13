'use client'

import { PageWrapper }            from '@/components/layout/PageWrapper'
import { Header }                 from '@/components/layout/Header'
import { IntegrationCard }        from '@/components/integrations/IntegrationCard'
import { AppleHealthShortcut }    from '@/components/integrations/AppleHealthShortcut'
import { useLocale }              from '@/contexts/LocaleContext'
import { Clock }                  from 'lucide-react'
import type { IntegrationStatus } from '@/types'

export default function IntegrationsPage() {
  const { t } = useLocale()

  const integrations: IntegrationStatus[] = [
    {
      id:          'google-fit',
      label:       'Google Fit',
      description: t('integrations.googleFitDescription'),
      logoSrc:     '/icons/google-fit.svg',
      isConnected: false,
      isMocked:    true,
      service:     'GOOGLE_FIT',
    },
    {
      id:          'strava',
      label:       'Strava',
      description: t('integrations.stravaDescription'),
      logoSrc:     '/icons/strava.svg',
      isConnected: false,
      isMocked:    true,
      service:     'STRAVA',
    },
    {
      id:          'fitbit',
      label:       'Fitbit',
      description: t('integrations.fitbitDescription'),
      logoSrc:     '/icons/fitbit.svg',
      isConnected: false,
      isMocked:    true,
      service:     'FITBIT',
    },
    {
      id:          'garmin',
      label:       'Garmin',
      description: t('integrations.garminDescription'),
      logoSrc:     '/icons/garmin.svg',
      isConnected: false,
      isMocked:    true,
      service:     'GARMIN',
    },
    {
      id:          'myfitnesspal',
      label:       'MyFitnessPal',
      description: t('integrations.myFitnessPalDescription'),
      logoSrc:     '/icons/myfitnesspal.svg',
      isConnected: false,
      isMocked:    true,
      service:     'MYFITNESSPAL',
    },
  ]

  return (
    <>
      <Header titleKey="nav.integrations" />
      <PageWrapper>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('integrations.title')}</h1>
            <p className="text-sm text-zinc-400 mt-1">
              {t('integrations.subtitle')}
            </p>
          </div>

          {/* Apple Health integration */}
          <AppleHealthShortcut />

          {/* Other OAuth integrations: coming soon */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">{t('integrations.comingSoon')}</p>
            <div className="flex items-center gap-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-300 mb-4">
              <Clock className="size-4 shrink-0" />
              {t('integrations.oauthComingSoon')}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {integrations.map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>
          </div>
        </div>
      </PageWrapper>
    </>
  )
}
