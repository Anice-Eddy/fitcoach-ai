// Stockage local : localStorage (profil/settings) + IndexedDB (métriques volumineuses)
// Fonctionne sans compte — badge "offline" affiché dans le header
// deps: npm install idb

import { openDB, type IDBPDatabase } from 'idb'
import type { StorageAdapter, UserProfile } from './StorageAdapter'
import type { OnboardingData, BodyMetricInput } from '@/utils/validators'

const LS_PROFILE_KEY    = 'BodyOps:profile'
const LS_ONBOARDING_KEY = 'BodyOps:onboarding'
const DB_NAME           = 'BodyOps-db'
const DB_VERSION        = 1
const STORE_METRICS     = 'body_metrics'

let db: IDBPDatabase | null = null

// Opens (or returns the cached) IndexedDB database, creating the body_metrics store on first run.
async function getDB(): Promise<IDBPDatabase> {
  if (db) return db
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_METRICS)) {
        const store = database.createObjectStore(STORE_METRICS, {
          keyPath: 'id',
          autoIncrement: true,
        })
        store.createIndex('date', 'date')
      }
    },
  })
  return db
}

/** StorageAdapter implementation that persists profile/settings to localStorage and body metrics to IndexedDB. */
export class LocalStorageAdapter implements StorageAdapter {
  /** Returns the storage mode identifier 'local'. */
  getMode() { return 'local' as const }
  /** Returns true when running in a browser context. */
  isReady()  { return typeof window !== 'undefined' }

  // --- Profil ---

  /** Reads and parses the profile from localStorage; returns null when unavailable or in SSR context. */
  async getProfile(): Promise<UserProfile | null> {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(LS_PROFILE_KEY)
    return raw ? (JSON.parse(raw) as UserProfile) : null
  }

  /** Merges partial data into the existing profile and persists the updated object to localStorage. */
  async saveProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const current = await this.getProfile()
    const updated  = { ...current, ...data, id: current?.id ?? crypto.randomUUID() } as UserProfile
    localStorage.setItem(LS_PROFILE_KEY, JSON.stringify(updated))
    return updated
  }

  // --- Métriques corporelles (IndexedDB) ---

  /** Retrieves the most recent body metrics from IndexedDB, sorted descending by date, up to the given limit. */
  async getBodyMetrics(limit = 90): Promise<BodyMetricInput[]> {
    const database = await getDB()
    const all      = await database.getAllFromIndex(STORE_METRICS, 'date')
    return all.slice(-limit).reverse() as BodyMetricInput[]
  }

  /** Inserts a body metric entry into IndexedDB, defaulting the date to now if omitted. */
  async addBodyMetric(metric: BodyMetricInput): Promise<void> {
    const database = await getDB()
    await database.add(STORE_METRICS, { ...metric, date: metric.date ?? new Date() })
  }

  // --- Onboarding ---

  /** Merges partial onboarding data with the current progress and persists step + data to localStorage. */
  async saveOnboardingProgress(step: number, data: Partial<OnboardingData>): Promise<void> {
    const current = await this.getOnboardingProgress()
    const merged  = { step, data: { ...current?.data, ...data } }
    localStorage.setItem(LS_ONBOARDING_KEY, JSON.stringify(merged))
  }

  /** Reads the saved onboarding step and partial data from localStorage; returns null in SSR context. */
  async getOnboardingProgress() {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(LS_ONBOARDING_KEY)
    return raw ? JSON.parse(raw) : null
  }

  /** Removes the onboarding progress entry from localStorage. */
  async clearOnboardingProgress(): Promise<void> {
    localStorage.removeItem(LS_ONBOARDING_KEY)
  }

  /** Clears the profile and onboarding keys from localStorage and deletes all records from the metrics IndexedDB store. */
  async clear(): Promise<void> {
    localStorage.removeItem(LS_PROFILE_KEY)
    localStorage.removeItem(LS_ONBOARDING_KEY)
    const database = await getDB()
    await database.clear(STORE_METRICS)
  }
}
