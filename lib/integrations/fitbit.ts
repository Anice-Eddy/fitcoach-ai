// Connecteur Fitbit — mocké MVP
import type { IntegrationConnector } from './types'
export const fitbitConnector: IntegrationConnector = {
  service: 'FITBIT', label: 'Fitbit', logoSrc: '/icons/fitbit.svg', isMocked: true,
  connect:    async () => { throw new Error('Disponible prochainement.') },
  disconnect: async () => { throw new Error('Non connecté.') },
  sync:       async () => [{ date: new Date().toISOString(), steps: 9100, caloriesBurned: 450, heartRateAvg: 68 }],
}
