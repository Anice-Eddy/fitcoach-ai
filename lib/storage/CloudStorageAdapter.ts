// Stockage cloud : appels API Next.js → Prisma → Neon PostgreSQL
// Utilisé après connexion OAuth (Google / GitHub)
// Synchronisation multi-device + migration depuis localStorage possible

import type { StorageAdapter, UserProfile } from './StorageAdapter'
import type { OnboardingData, BodyMetricInput } from '@/utils/validators'

export class CloudStorageAdapter implements StorageAdapter {
  getMode() { return 'cloud' as const }
  isReady()  { return true }

  // --- Profil ---

  async getProfile(): Promise<UserProfile | null> {
    const res = await fetch('/api/user/profile')
    if (!res.ok) return null
    return res.json()
  }

  async saveProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch('/api/user/profile', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Erreur lors de la sauvegarde du profil')
    return res.json()
  }

  // --- Métriques corporelles ---

  async getBodyMetrics(limit = 90): Promise<BodyMetricInput[]> {
    const res = await fetch(`/api/user/metrics?limit=${limit}`)
    if (!res.ok) return []
    return res.json()
  }

  async addBodyMetric(metric: BodyMetricInput): Promise<void> {
    const res = await fetch('/api/user/metrics', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(metric),
    })
    if (!res.ok) throw new Error('Erreur lors de l\'ajout de la métrique')
  }

  // --- Onboarding (stocké localement même en mode cloud — pas besoin d'une route dédiée) ---

  async saveOnboardingProgress(step: number, data: Partial<OnboardingData>): Promise<void> {
    const key = 'BodyOps:onboarding:cloud'
    const current = this.getLocalOnboarding()
    localStorage.setItem(key, JSON.stringify({ step, data: { ...current?.data, ...data } }))
  }

  async getOnboardingProgress() {
    return this.getLocalOnboarding()
  }

  async clearOnboardingProgress(): Promise<void> {
    localStorage.removeItem('BodyOps:onboarding:cloud')
  }

  async clear(): Promise<void> {
    const res = await fetch('/api/user/profile', { method: 'DELETE' })
    if (!res.ok) throw new Error('Erreur lors de la suppression du compte')
  }

  private getLocalOnboarding() {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem('BodyOps:onboarding:cloud')
    return raw ? JSON.parse(raw) : null
  }
}

// Migration : copie les données locales vers le cloud après connexion OAuth
export async function migrateLocalToCloud(
  local: StorageAdapter,
  cloud: StorageAdapter,
): Promise<void> {
  const profile = await local.getProfile()
  if (profile) {
    await cloud.saveProfile(profile)
  }
  const metrics = await local.getBodyMetrics(365)
  for (const metric of metrics.reverse()) {
    await cloud.addBodyMetric(metric)
  }
  await local.clear()
}
