// Fitbit connector: mocked MVP.
import type { IntegrationConnector } from './types'
export const fitbitConnector: IntegrationConnector = {
  service: 'FITBIT', label: 'Fitbit', logoSrc: '/icons/fitbit.svg', isMocked: true,
  connect:    async () => { throw new Error('Coming soon.') },
  disconnect: async () => { throw new Error('Not connected.') },
  sync:       async () => [{ date: new Date().toISOString(), steps: 9100, caloriesBurned: 450, heartRateAvg: 68 }],
}
