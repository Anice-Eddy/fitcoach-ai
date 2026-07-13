import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
  })

  test('shows the main headline', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible()
    const h1Text = await page.locator('h1').textContent()
    expect(h1Text?.length).toBeGreaterThan(0)
  })

  test('shows a CTA button to registration or sign-in', async ({ page }) => {
    const ctaLinks = page.locator('a[href*="sign"], a[href*="auth"], a[href*="register"]')
    await expect(ctaLinks.first()).toBeVisible()
  })

  test('shows the pricing section or pricing link', async ({ page }) => {
    const pricingLink = page.locator('a[href*="pricing"]')
    const pricingSection = page.locator('[data-testid="pricing"], section:has-text("prix"), section:has-text("Plan")')
    const hasPricing = await pricingLink.count() > 0 || await pricingSection.count() > 0
    expect(hasPricing).toBe(true)
  })

  test('shows features or benefits', async ({ page }) => {
    const features = page.locator('section:has-text("Coach"), section:has-text("nutrition"), section:has-text("IA")')
    await expect(features.first()).toBeVisible()
  })

  test('shows the main navigation', async ({ page }) => {
    const nav = page.locator('nav, header')
    await expect(nav.first()).toBeVisible()
  })

  test('lets visitors switch language from the public landing page', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('bodyops:locale', 'fr'))
    await page.reload({ waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('link', { name: /se connecter/i })).toBeVisible()

    await page.getByRole('button', { name: 'EN', description: 'English' }).click()

    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect.poll(() => page.evaluate(() => localStorage.getItem('bodyops:locale'))).toBe('en')
  })

  test('shows the footer when present', async ({ page }) => {
    const footer = page.locator('footer')
    if (await footer.count() > 0) {
      await expect(footer).toBeVisible()
    }
  })
})

test.describe('Landing locale detection', () => {
  test.use({ locale: 'en-US' })

  test('uses browser language on first visit when no saved preference exists', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })
})

test.describe('Landing navigation', () => {
  test('the Pricing link opens the pricing page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const pricingLink = page.locator('a[href="/pricing"]').first()
    if (await pricingLink.count() > 0) {
      await pricingLink.click()
      await expect(page).toHaveURL('/pricing')
    }
  })

  test('/pricing loads correctly', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('the Pricing page also exposes the language switcher', async ({ page }) => {
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => localStorage.setItem('bodyops:locale', 'fr'))
    await page.reload({ waitUntil: 'domcontentloaded' })

    await page.getByRole('button', { name: 'EN', description: 'English' }).click()
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  for (const path of ['/privacy', '/terms']) {
    test(`${path} exposes the language switcher`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await page.evaluate(() => localStorage.setItem('bodyops:locale', 'fr'))
      await page.reload({ waitUntil: 'domcontentloaded' })

      await page.getByRole('button', { name: 'EN', description: 'English' }).click()
      await expect(page.locator('html')).toHaveAttribute('lang', 'en')
      await expect(page.locator('h1')).toBeVisible()
    })
  }
})
