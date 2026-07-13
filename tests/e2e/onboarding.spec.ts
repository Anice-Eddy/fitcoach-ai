import { test, expect } from '@playwright/test'

test.describe('Onboarding page structure', () => {
  test('/onboarding redirects or shows the wizard', async ({ page }) => {
    await page.goto('/onboarding', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('body')).toBeVisible()

    const url = page.url()
    // Either shows onboarding wizard or redirects to auth
    const isOnboarding = url.includes('/onboarding')
    const isAuth       = url.includes('/signin') || url.includes('/auth')
    expect(isOnboarding || isAuth).toBe(true)
  })

  test('an unknown route is handled by 404 or auth protection', async ({ page }) => {
    await page.goto('/route-inexistante-xyz-123', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('body')).toBeVisible()
    const url    = page.url()
    const body   = await page.locator('body').textContent()
    const is404  = body?.includes('404') || body?.toLowerCase().includes('introuvable') || body?.toLowerCase().includes('not found')
    const isAuth = url.includes('signin') || url.includes('auth') || url.includes('login')
    expect(is404 || isAuth).toBe(true)
  })
})

test.describe('Public navigation', () => {
  test('/pricing is publicly accessible', async ({ page }) => {
    const response = await page.goto('/pricing', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBeLessThan(400)
  })

  test('/ is publicly accessible', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBeLessThan(400)
  })

  test('/auth/signin is publicly accessible', async ({ page }) => {
    const response = await page.goto('/auth/signin', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBeLessThan(400)
  })

  test('protected pages redirect to auth', async ({ page }) => {
    for (const route of ['/dashboard', '/training', '/nutrition', '/shop', '/settings']) {
      await page.goto(route, { waitUntil: 'domcontentloaded' })
      const url = page.url()
      const isRedirectedToAuth = url.includes('signin') || url.includes('auth') || url.includes('login')
      expect(isRedirectedToAuth, `${route} should redirect to auth`).toBe(true)
    }
  })
})

test.describe('Mobile responsiveness', () => {
  test.use({ viewport: { width: 390, height: 844 } }) // iPhone 14 Pro

  test('the landing page is readable on mobile', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('h1')).toBeVisible()
    // Check no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(390 + 5) // 5px tolerance
  })

  test('the pricing page is readable on mobile', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })
})
