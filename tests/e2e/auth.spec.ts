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

  test('affiche la connexion par email', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    await expect(page.getByPlaceholder('jean@example.com')).toBeVisible()
    await expect(page.getByPlaceholder('••••••••')).toBeVisible()
  })

  test('explique quand le compte Google existe déjà en contexte coach', async ({ page }) => {
    await page.evaluate(() => sessionStorage.setItem('bodyops:last-auth-context', 'coach'))
    await page.goto('/auth/signin?error=OAuthAccountNotLinked')
    await expect(page.getByText('Connexion coach')).toBeVisible()
    await expect(page.getByText("Ce compte Google est déjà lié à un autre utilisateur. Essayez de vous connecter avec votre email et mot de passe, ou contactez le support.")).toBeVisible()
  })

  test("affiche une erreur email introuvable sans bloquer le bouton", async ({ page }) => {
    await page.route('**/api/auth/check-provider?email=missing%40example.com', async (route) => {
      await route.fulfill({ json: { provider: null } })
    })

    await page.getByPlaceholder('jean@example.com').fill('missing@example.com')
    await page.getByPlaceholder('••••••••').fill('password123')
    const submit = page.getByRole('button', { name: /se connecter/i })
    await submit.click()

    await expect(page.getByText("Aucun compte n'existe avec cette adresse email.")).toBeVisible()
    await expect(submit).toBeEnabled()
  })

  test('affiche une erreur mot de passe incorrect sans bloquer le bouton', async ({ page }) => {
    await page.route('**/api/auth/check-provider?email=member%40example.com', async (route) => {
      await route.fulfill({ json: { provider: 'EMAIL' } })
    })
    await page.route('**/api/auth/validate-credentials', async (route) => {
      await route.fulfill({ status: 401, json: { valid: false, reason: 'BAD_PASSWORD' } })
    })

    await page.getByPlaceholder('jean@example.com').fill('member@example.com')
    await page.getByPlaceholder('••••••••').fill('wrong-password')
    const submit = page.getByRole('button', { name: /se connecter/i })
    await submit.click()

    await expect(page.getByText('Mot de passe incorrect.')).toBeVisible()
    await expect(submit).toBeEnabled()
  })

  test('redirige vers la landing si on clique sur retour', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    const backLink = page.locator('a[href="/"], a:has-text("Retour"), a:has-text("Accueil")')
    if (await backLink.count() > 0) {
      await backLink.first().click()
      await page.waitForURL('/', { timeout: 15000 })
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
