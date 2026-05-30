import { expect, test } from '@playwright/test'

const MOCK_COACH_ID         = 'user-coach-e2e'
const MOCK_COACH_PROFILE_ID = 'coach-profile-e2e'

// Tomorrow at 10:00 UTC — guaranteed future slot
function tomorrowSlot() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(10, 0, 0, 0)
  return d.toISOString()
}

test.describe('Parcours accompagnement', () => {
  test('le choix coach réel ouvre la réservation puis la confirmation', async ({ page }) => {
    const slot = tomorrowSlot()

    // Mock coaches list — returns one real (non-demo) coach
    await page.route('**/api/coaches', route =>
      route.fulfill({
        status:      200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id:    MOCK_COACH_ID,
          name:  'Sarah B.',
          image: null,
          coachProfile: {
            id:           MOCK_COACH_PROFILE_ID,
            bio:          'Coach certifiée en musculation et perte de poids.',
            specialties:  ['Musculation', 'Perte de poids'],
            isVerified:   true,
            _count:       { coachMembers: 12 },
          },
        }]),
      })
    )

    // Mock coach detail page
    await page.route(`**/api/coaches/${MOCK_COACH_ID}`, route =>
      route.fulfill({
        status:      200,
        contentType: 'application/json',
        body: JSON.stringify({
          id:    MOCK_COACH_ID,
          name:  'Sarah B.',
          image: null,
          coachProfile: {
            id:           MOCK_COACH_PROFILE_ID,
            bio:          'Coach certifiée en musculation et perte de poids.',
            specialties:  ['Musculation', 'Perte de poids'],
            isVerified:   true,
            _count:       { coachMembers: 12 },
          },
        }),
      })
    )

    // Mock availability slots — one slot tomorrow at 10:00
    await page.route(`**/api/coaches/${MOCK_COACH_PROFILE_ID}/slots**`, route =>
      route.fulfill({
        status:      200,
        contentType: 'application/json',
        body: JSON.stringify([{ datetime: slot, duration: 60 }]),
      })
    )

    // Mock appointment creation
    await page.route('**/api/user/appointments', route =>
      route.fulfill({
        status:      201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'appt-e2e' }),
      })
    )

    await page.goto('/choose')
    // Button has aria-label="Prendre rendez-vous avec un coach réel"
    await page.getByRole('button', { name: /coach réel/i }).click()
    await expect(page).toHaveURL(/\/coaches/)
    await expect(page.getByText('Sarah B.')).toBeVisible()
    await page.getByRole('link', { name: /Sarah B\./i }).click()
    await expect(page).toHaveURL(new RegExp(`/coaches/${MOCK_COACH_ID}`))

    // Select the first available day (slot is tomorrow)
    await page.getByRole('button', { name: /lun|mar|mer|jeu|ven|sam|dim/i }).first().click()

    // Select the 10:00 slot
    await page.getByRole('button', { name: /10.00|10:00/i }).click()

    // Confirm button should now be visible
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
