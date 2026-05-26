import { expect, test } from '@playwright/test'

test.describe('Parcours accompagnement', () => {
  test('le choix coach réel ouvre la réservation puis la confirmation', async ({ page }) => {
    await page.goto('/choose')
    await page.getByRole('button', { name: /coach réel/i }).click()
    await expect(page).toHaveURL(/\/coaches\/coach-1/)
    await expect(page.getByText('Sarah B.')).toBeVisible()

    await page.getByRole('button', { name: /confirmer le rendez-vous/i }).click()
    await expect(page).toHaveURL(/\/coaching\/status/)
    await expect(page.getByRole('heading', { name: /demande envoyée/i })).toBeVisible()
  })

  test('un profil local complet ouvre directement le résumé onboarding', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('BodyOps:profile', JSON.stringify({
        id: 'profile-e2e',
        firstName: 'Alex',
        age: 28,
        gender: 'MALE',
        weightKg: 78.4,
        heightCm: 178,
        weightUnit: 'KG',
        heightUnit: 'CM',
        activityLevel: 'MODERATELY_ACTIVE',
        availableEquipment: ['BARBELL', 'DUMBBELL'],
        trainingDaysPerWeek: 4,
        fitnessGoal: 'MUSCLE_GAIN',
        fitnessLevel: 'INTERMEDIATE',
        dietaryRestrictions: [],
        foodPreferences: [],
        language: 'fr',
        darkMode: true,
        onboardingCompleted: true,
      }))
    })

    await page.goto('/onboarding')
    await expect(page.getByText('Voici ton profil fitness calculé')).toBeVisible()
    await expect(page.getByRole('button', { name: /commencer/i })).toBeVisible()
  })
})
