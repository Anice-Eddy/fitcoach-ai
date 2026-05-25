import { test, expect } from '@playwright/test'

test.describe('Page de connexion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin')
  })

  test('affiche la page de connexion', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('affiche le bouton Google', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    const googleBtn = page.locator('button:has-text("Google"), a:has-text("Google")')
    await expect(googleBtn.first()).toBeVisible()
  })

  test('affiche le bouton GitHub', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    const githubBtn = page.locator('button:has-text("GitHub"), a:has-text("GitHub")')
    await expect(githubBtn.first()).toBeVisible()
  })

  test('redirige vers la landing si on clique sur retour', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    const backLink = page.locator('a[href="/"], a:has-text("Retour"), a:has-text("Accueil")')
    if (await backLink.count() > 0) {
      await backLink.first().click()
      await expect(page).toHaveURL('/')
    }
  })
})

test.describe('Protection des routes authentifiées', () => {
  test('redirige vers signin si non authentifié sur /dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    // Should be redirected to signin
    const url = page.url()
    expect(url).toMatch(/signin|auth|login/)
  })

  test('redirige vers signin si non authentifié sur /training', async ({ page }) => {
    await page.goto('/training')
    await page.waitForLoadState('networkidle')
    const url = page.url()
    expect(url).toMatch(/signin|auth|login/)
  })

  test('redirige vers signin si non authentifié sur /nutrition', async ({ page }) => {
    await page.goto('/nutrition')
    await page.waitForLoadState('networkidle')
    const url = page.url()
    expect(url).toMatch(/signin|auth|login/)
  })
})
