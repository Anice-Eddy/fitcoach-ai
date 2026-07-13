// Garmin connector: mocked MVP.
import type { IntegrationConnector } from './types'
export const garminConnector: IntegrationConnector = {
  service: 'GARMIN', label: 'Garmin', logoSrc: '/icons/garmin.svg', isMocked: true,
  connect:    async () => { throw new Error('Coming soon.') },
  disconnect: async () => { throw new Error('Not connected.') },
  sync:       async () => [{ date: new Date().toISOString(), steps: 11200, caloriesBurned: 520, heartRateAvg: 72 }],
}
