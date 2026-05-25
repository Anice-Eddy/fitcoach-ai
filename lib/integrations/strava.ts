// Connecteur Strava — mocké MVP, architecture prête pour OAuth réel
// Phase 2 : implémenter le flow OAuth Strava + normalisation des activités

import type { IntegrationConnector, NormalizedActivity } from './types'

export const stravaConnector: IntegrationConnector = {
  service:  'STRAVA',
  label:    'Strava',
  logoSrc:  '/icons/strava.svg',
  isMocked: true,

  connect: async () => {
    // Phase 2 : redirect vers /api/auth/strava → OAuth flow
    throw new Error('Intégration Strava disponible prochainement.')
  },

  disconnect: async () => {
    throw new Error('Non connecté.')
  },

  sync: async (): Promise<NormalizedActivity[]> => {
    // Phase 2 : GET https://www.strava.com/api/v3/athlete/activities
    return [
      { date: new Date().toISOString(), steps: 8500, caloriesBurned: 420, activities: [{ name: 'Course à pied', durationMinutes: 35, calories: 320 }] },
    ]
  },
}
