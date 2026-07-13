// Strava connector: mocked MVP with architecture ready for real OAuth.
// Phase 2: implement the Strava OAuth flow and activity normalization.

import type { IntegrationConnector, NormalizedActivity } from './types'

export const stravaConnector: IntegrationConnector = {
  service:  'STRAVA',
  label:    'Strava',
  logoSrc:  '/icons/strava.svg',
  isMocked: true,

  connect: async () => {
    // Phase 2: redirect to /api/auth/strava for the OAuth flow.
    throw new Error('Strava integration is coming soon.')
  },

  disconnect: async () => {
    throw new Error('Not connected.')
  },

  sync: async (): Promise<NormalizedActivity[]> => {
    // Phase 2: GET https://www.strava.com/api/v3/athlete/activities.
    return [
      { date: new Date().toISOString(), steps: 8500, caloriesBurned: 420, activities: [{ name: 'Running', durationMinutes: 35, calories: 320 }] },
    ]
  },
}
