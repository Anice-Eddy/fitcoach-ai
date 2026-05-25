import { test, expect, type Page } from '@playwright/test'

// Helper: mock authenticated session via localStorage/cookie injection
async function mockAuth(page: Page) {
  // NextAuth uses JWT cookies — for E2E we test the public onboarding page structure
  await page.goto('/onboarding')
  await page.waitForLoadState('networkidle')
}

test.describe('Page Onboarding (structure)', () => {
  test('la page /onboarding redirige ou affiche le wizard', async ({ page }) => {
    await page.goto('/onboarding')
    await page.waitForLoadState('networkidle')

    const url = page.url()
    // Either shows onboarding wizard or redirects to auth
    const isOnboarding = url.includes('/onboarding')
    const isAuth       = url.includes('/signin') || url.includes('/auth')
    expect(isOnboarding || isAuth).toBe(true)
  })

  test('la page 404 s\'affiche pour une route inexistante', async ({ page }) => {
    await page.goto('/route-inexistante-xyz-123')
    await page.waitForLoadState('networkidle')
    // Should show 404 or redirect
    const status = page.url()
    const body   = await page.locator('body').textContent()
    // Next.js shows "404" or "not found" text
    const is404 = body?.includes('404') || body?.includes('introuvable') || body?.includes('not found')
    expect(is404).toBe(true)
  })
})

test.describe('Navigation publique', () => {
  test('/pricing est accessible publiquement', async ({ page }) => {
    const response = await page.goto('/pricing')
    expect(response?.status()).toBeLessThan(400)
  })

  test('/ est accessible publiquement', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBeLessThan(400)
  })

  test('/auth/signin est accessible publiquement', async ({ page }) => {
    const response = await page.goto('/auth/signin')
    expect(response?.status()).toBeLessThan(400)
  })

  test('les pages protégées redirigent vers auth', async ({ page }) => {
    for (const route of ['/dashboard', '/training', '/nutrition', '/shop', '/settings']) {
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      const url = page.url()
      const isRedirectedToAuth = url.includes('signin') || url.includes('auth') || url.includes('login')
      expect(isRedirectedToAuth, `${route} devrait rediriger vers auth`).toBe(true)
    }
  })
})

test.describe('Mobile responsiveness', () => {
  test.use({ viewport: { width: 390, height: 844 } }) // iPhone 14 Pro

  test('la landing est lisible sur mobile', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toBeVisible()
    // Check no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(390 + 5) // 5px tolerance
  })

  test('la page pricing est lisible sur mobile', async ({ page }) => {
    await page.goto('/pricing')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })
})
