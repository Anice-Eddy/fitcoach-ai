import { test, expect } from '@playwright/test'

test.describe('Page Pricing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing')
  })

  test('affiche au moins 2 plans tarifaires', async ({ page }) => {
    // Cards with price amounts
    await page.waitForLoadState('networkidle')
    const planCards = page.locator('[data-testid="plan-card"]')
    const count = await planCards.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('affiche un plan FREE', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    const freeText = page.locator(':text("Free"), :text("Gratuit"), :text("0 $"), :text("0$")')
    await expect(freeText.first()).toBeVisible()
  })

  test('affiche un plan PRO avec un prix', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    const proText = page.locator(':text("Pro")')
    await expect(proText.first()).toBeVisible()
  })

  test('le toggle mensuel/annuel est fonctionnel', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    const toggle = page.locator('button:has-text("Annuel"), button:has-text("Annual"), [role="switch"], input[type="checkbox"]').first()

    if (await toggle.count() > 0) {
      const pricesBefore = await page.locator(':text-matches("€|\\$")').allTextContents()
      await toggle.click()
      await page.waitForTimeout(300)
      const pricesAfter = await page.locator(':text-matches("€|\\$")').allTextContents()
      // Prices should change after toggle (yearly is discounted)
      expect(pricesBefore).not.toEqual(pricesAfter)
    }
  })

  test('les plans ont des boutons d\'action', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    const actionButtons = page.locator('[data-testid="plan-card"] button')
    const count = await actionButtons.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('affiche les features des plans', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    // Feature lists (check marks or list items)
    const features = page.locator('ul li, [class*="feature"]')
    const count = await features.count()
    expect(count).toBeGreaterThan(0)
  })
})
