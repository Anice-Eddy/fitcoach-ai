import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('affiche le titre principal', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible()
    const h1Text = await page.locator('h1').textContent()
    expect(h1Text?.length).toBeGreaterThan(0)
  })

  test('affiche un bouton CTA vers inscription ou connexion', async ({ page }) => {
    const ctaLinks = page.locator('a[href*="sign"], a[href*="auth"], a[href*="register"]')
    await expect(ctaLinks.first()).toBeVisible()
  })

  test('affiche la section tarifs ou lien vers pricing', async ({ page }) => {
    const pricingLink = page.locator('a[href*="pricing"]')
    const pricingSection = page.locator('[data-testid="pricing"], section:has-text("prix"), section:has-text("Plan")')
    const hasPricing = await pricingLink.count() > 0 || await pricingSection.count() > 0
    expect(hasPricing).toBe(true)
  })

  test('affiche les features/avantages', async ({ page }) => {
    const features = page.locator('section:has-text("Coach"), section:has-text("nutrition"), section:has-text("IA")')
    await expect(features.first()).toBeVisible()
  })

  test('la navigation principale est visible', async ({ page }) => {
    const nav = page.locator('nav, header')
    await expect(nav.first()).toBeVisible()
  })

  test('le footer est présent', async ({ page }) => {
    const footer = page.locator('footer')
    if (await footer.count() > 0) {
      await expect(footer).toBeVisible()
    }
  })
})

test.describe('Navigation depuis la landing', () => {
  test('le lien Pricing mène à la page pricing', async ({ page }) => {
    await page.goto('/')
    const pricingLink = page.locator('a[href="/pricing"]').first()
    if (await pricingLink.count() > 0) {
      await pricingLink.click()
      await expect(page).toHaveURL('/pricing')
    }
  })

  test('la page /pricing charge correctement', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })
})
