import { test, expect, type Page } from '@playwright/test'

async function mockFirebasePasswordSignInError(page: Page, message = 'INVALID_LOGIN_CREDENTIALS') {
  await page.route('https://identitytoolkit.googleapis.com/**', async (route) => {
    const request = route.request()
    if (!request.url().includes('accounts:signInWithPassword')) return route.continue()

    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          code: 400,
          message,
          errors: [{ message, domain: 'global', reason: 'invalid' }],
        },
      }),
    })
  })
}

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

  test('affiche le bouton Facebook', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    const facebookBtn = page.locator('button:has-text("Facebook"), a:has-text("Facebook")')
    await expect(facebookBtn.first()).toBeVisible()
  })

  test('affiche la connexion par email', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    await expect(page.getByPlaceholder('jean@example.com')).toBeVisible()
    await expect(page.getByPlaceholder('••••••••')).toBeVisible()
  })

  test('explique quand un compte social existe déjà en contexte coach', async ({ page }) => {
    await page.goto('/auth/signin?role=coach&error=OAuthAccountNotLinked')
    await expect(page.getByText('Connexion coach')).toBeVisible()
    await expect(page.getByText("Ce compte social est déjà lié à un autre utilisateur. Essayez de vous connecter avec votre email et mot de passe, ou contactez le support.")).toBeVisible()
  })

  test("affiche une erreur Firebase si l'email est introuvable sans bloquer le bouton", async ({ page }) => {
    await mockFirebasePasswordSignInError(page, 'EMAIL_NOT_FOUND')
    await page.getByPlaceholder('jean@example.com').fill('missing@example.com')
    await page.getByPlaceholder('••••••••').fill('password123')
    const submit = page.getByRole('button', { name: /se connecter/i })
    await submit.click()

    await expect(page.getByText('Email ou mot de passe Firebase incorrect.')).toBeVisible()
    await expect(submit).toBeEnabled()
  })

  test('affiche une erreur Firebase si le mot de passe est incorrect sans bloquer le bouton', async ({ page }) => {
    await mockFirebasePasswordSignInError(page, 'INVALID_PASSWORD')
    await page.getByPlaceholder('jean@example.com').fill('member@example.com')
    await page.getByPlaceholder('••••••••').fill('wrong-password')
    const submit = page.getByRole('button', { name: /se connecter/i })
    await submit.click()

    await expect(page.getByText('Email ou mot de passe Firebase incorrect.')).toBeVisible()
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
