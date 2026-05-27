// Stockage cloud : appels API Next.js → Prisma → Neon PostgreSQL
// Utilisé après connexion OAuth (Google / GitHub)
// Synchronisation multi-device + migration depuis localStorage possible

import type { StorageAdapter, UserProfile } from './StorageAdapter'
import type { OnboardingData, BodyMetricInput } from '@/utils/validators'

/** StorageAdapter implementation that delegates all persistence to the Next.js API (Prisma/Neon); used after OAuth sign-in. */
export class CloudStorageAdapter implements StorageAdapter {
  /** Returns the storage mode identifier 'cloud'. */
  getMode() { return 'cloud' as const }
  /** Always returns true since cloud storage is always ready once authenticated. */
  isReady()  { return true }

  // --- Profil ---

  /** Fetches the user profile from the API; returns null on error. */
  async getProfile(): Promise<UserProfile | null> {
    const res = await fetch('/api/user/profile')
    if (!res.ok) return null
    return res.json()
  }

  /** Sends a PATCH request to update the user profile; throws on API error. */
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

  /** Fetches body metrics from the API up to the given limit; returns empty array on error. */
  async getBodyMetrics(limit = 90): Promise<BodyMetricInput[]> {
    const res = await fetch(`/api/user/metrics?limit=${limit}`)
    if (!res.ok) return []
    return res.json()
  }

  /** Posts a new body metric to the API; throws on API error. */
  async addBodyMetric(metric: BodyMetricInput): Promise<void> {
    const res = await fetch('/api/user/metrics', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(metric),
    })
    if (!res.ok) throw new Error('Erreur lors de l\'ajout de la métrique')
  }

  // --- Onboarding (stocké localement même en mode cloud — pas besoin d'une route dédiée) ---

  /** Persists onboarding progress locally (in cloud mode the cloud key is used) to avoid a dedicated API route. */
  async saveOnboardingProgress(step: number, data: Partial<OnboardingData>): Promise<void> {
    const key = 'BodyOps:onboarding:cloud'
    const current = this.getLocalOnboarding()
    localStorage.setItem(key, JSON.stringify({ step, data: { ...current?.data, ...data } }))
  }

  /** Returns the locally-stored onboarding progress for cloud sessions. */
  async getOnboardingProgress() {
    return this.getLocalOnboarding()
  }

  /** Removes the cloud onboarding progress entry from localStorage. */
  async clearOnboardingProgress(): Promise<void> {
    localStorage.removeItem('BodyOps:onboarding:cloud')
  }

  /** Sends a DELETE to the profile API to permanently remove the user account; throws on API error. */
  async clear(): Promise<void> {
    const res = await fetch('/api/user/profile', { method: 'DELETE' })
    if (!res.ok) throw new Error('Erreur lors de la suppression du compte')
  }

  // Reads the cloud onboarding progress key from localStorage; returns null in SSR or when absent.
  private getLocalOnboarding() {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem('BodyOps:onboarding:cloud')
    return raw ? JSON.parse(raw) : null
  }
}

// Migration : copie les données locales vers le cloud après connexion OAuth
/** Copies the local profile and all metrics to cloud storage, then clears local data; called once after OAuth sign-in. */
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
