// Connecteur Google Fit — mocké MVP
import type { IntegrationConnector } from './types'
export const googleFitConnector: IntegrationConnector = {
  service: 'GOOGLE_FIT', label: 'Google Fit', logoSrc: '/icons/google.svg', isMocked: true,
  connect:    async () => { throw new Error('Disponible prochainement.') },
  disconnect: async () => { throw new Error('Non connecté.') },
  sync:       async () => [{ date: new Date().toISOString(), steps: 7200, caloriesBurned: 380 }],
}
