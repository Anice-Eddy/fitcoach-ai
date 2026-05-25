// Connecteur Garmin — mocké MVP
import type { IntegrationConnector } from './types'
export const garminConnector: IntegrationConnector = {
  service: 'GARMIN', label: 'Garmin', logoSrc: '/icons/garmin.svg', isMocked: true,
  connect:    async () => { throw new Error('Disponible prochainement.') },
  disconnect: async () => { throw new Error('Non connecté.') },
  sync:       async () => [{ date: new Date().toISOString(), steps: 11200, caloriesBurned: 520, heartRateAvg: 72 }],
}
