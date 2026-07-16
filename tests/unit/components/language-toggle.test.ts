import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '@/contexts/LocaleContext'
import { LanguageToggle } from '@/components/i18n/LanguageToggle'
import { useUIStore } from '@/stores/uiStore'
import { useUserStore } from '@/stores/userStore'
import type { UserProfile } from '@/lib/storage/StorageAdapter'
import { toast } from 'sonner'

const baseProfile = {
  id: 'profile_1',
  firstName: 'Eddy',
  age: 28,
  gender: 'MALE',
  weightKg: 89,
  heightCm: 183,
  weightUnit: 'KG',
  heightUnit: 'CM',
  activityLevel: 'SEDENTARY',
  availableEquipment: [],
  trainingDaysPerWeek: 4,
  fitnessGoal: 'MUSCLE_GAIN',
  fitnessLevel: 'INTERMEDIATE',
  dietaryRestrictions: [],
  foodPreferences: [],
  language: 'fr',
  darkMode: true,
  onboardingCompleted: true,
} as unknown as UserProfile

function renderToggle(initialLocale: 'fr' | 'en' = 'fr') {
  return render(
    React.createElement(
      LocaleProvider,
      { initialLocale },
      React.createElement(LanguageToggle),
    ),
  )
}

describe('LanguageToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('bodyops:locale', 'fr')
    document.cookie = 'bodyops:locale=; path=/; max-age=0'
    useUIStore.setState({ language: 'fr' })
    useUserStore.setState({ profile: baseProfile })
    vi.stubGlobal('navigator', { language: 'fr-FR', languages: ['fr-FR'] })
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true })))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('switches locale, persists it, and syncs the profile preference', async () => {
    renderToggle('fr')

    await userEvent.click(screen.getByRole('button', { name: 'English' }))

    await waitFor(() => {
      expect(localStorage.getItem('bodyops:locale')).toBe('en')
      expect(document.documentElement.lang).toBe('en')
      expect(useUIStore.getState().language).toBe('en')
      expect(useUserStore.getState().profile?.language).toBe('en')
    })

    expect(fetch).toHaveBeenCalledWith('/api/user/profile', expect.objectContaining({
      method: 'PATCH',
      body:   JSON.stringify({ language: 'en' }),
    }))
  })

  it('keeps the local language change even if server sync fails', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('network'))))

    renderToggle('fr')
    await userEvent.click(screen.getByRole('button', { name: 'English' }))

    await waitFor(() => {
      expect(useUIStore.getState().language).toBe('en')
      expect(toast.error).toHaveBeenCalled()
    })
  })
})
