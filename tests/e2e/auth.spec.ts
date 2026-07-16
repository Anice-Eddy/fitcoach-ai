import { test, expect, type Page } from '@playwright/test'

async function preferFrench(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('bodyops:locale', 'fr')
  })
}

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

async function mockFirebaseEmailActionSuccess(page: Page) {
  await page.route('https://identitytoolkit.googleapis.com/**', async (route) => {
    const request = route.request()
    const url = request.url()

    if (url.includes('accounts:resetPassword')) {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify({ email: 'member@example.com', requestType: 'PASSWORD_RESET' }),
      })
      return
    }

    if (url.includes('accounts:update')) {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify({ email: 'member@example.com', emailVerified: true }),
      })
      return
    }

    await route.fulfill({
      status:      200,
      contentType: 'application/json',
      body:        JSON.stringify({}),
    })
  })
}

test.describe('Sign-in page', () => {
  test.use({ locale: 'fr-FR' })

  test.beforeEach(async ({ page }) => {
    await preferFrench(page)
    await page.goto('/auth/signin')
  })

  test('shows the sign-in page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /se connecter/i })).toBeVisible()
  })

  test('shows the Google button', async ({ page }) => {
    const googleBtn = page.locator('button:has-text("Google"), a:has-text("Google")')
    await expect(googleBtn.first()).toBeVisible()
  })

  test('shows the Facebook button', async ({ page }) => {
    const facebookBtn = page.locator('button:has-text("Facebook"), a:has-text("Facebook")')
    await expect(facebookBtn.first()).toBeVisible()
  })

  test('shows email sign-in', async ({ page }) => {
    await expect(page.getByPlaceholder('jean@example.com')).toBeVisible()
    await expect(page.getByPlaceholder('••••••••')).toBeVisible()
  })

  test('explains when a social account already exists in coach context', async ({ page }) => {
    await page.goto('/auth/signin?role=coach&error=OAuthAccountNotLinked')
    await expect(page.getByText('Connexion coach')).toBeVisible()
    await expect(page.getByText("Ce compte social est déjà lié à un autre utilisateur. Essayez de vous connecter avec votre email et mot de passe, ou contactez le support.")).toBeVisible()
  })

  test('shows an error for unknown email without blocking the button', async ({ page }) => {
    await mockFirebasePasswordSignInError(page, 'EMAIL_NOT_FOUND')
    await page.getByPlaceholder('jean@example.com').fill('missing@example.com')
    await page.getByPlaceholder('••••••••').fill('password123')
    const submit = page.getByRole('button', { name: /se connecter/i })
    await submit.click()

    await expect(page.getByText('Email ou mot de passe incorrect.')).toBeVisible()
    await expect(submit).toBeEnabled()
  })

  test('shows an error for incorrect password without blocking the button', async ({ page }) => {
    await mockFirebasePasswordSignInError(page, 'INVALID_PASSWORD')
    await page.getByPlaceholder('jean@example.com').fill('member@example.com')
    await page.getByPlaceholder('••••••••').fill('wrong-password')
    const submit = page.getByRole('button', { name: /se connecter/i })
    await submit.click()

    await expect(page.getByText('Email ou mot de passe incorrect.')).toBeVisible()
    await expect(submit).toBeEnabled()
  })

  test('links back to the landing page', async ({ page }) => {
    const homeLink = page.getByRole('link', { name: /bodyops/i }).first()
    await expect(homeLink).toHaveAttribute('href', '/')
  })
})

test.describe('Authenticated route protection', () => {
  test('redirects to signin when unauthenticated on /dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    // Should be redirected to signin
    const url = page.url()
    expect(url).toMatch(/signin|auth|login/)
  })

  test('redirects to signin when unauthenticated on /training', async ({ page }) => {
    await page.goto('/training')
    await page.waitForLoadState('networkidle')
    const url = page.url()
    expect(url).toMatch(/signin|auth|login/)
  })

  test('redirects to signin when unauthenticated on /nutrition', async ({ page }) => {
    await page.goto('/nutrition')
    await page.waitForLoadState('networkidle')
    const url = page.url()
    expect(url).toMatch(/signin|auth|login/)
  })
})

test.describe('Firebase email actions', () => {
  test.use({ locale: 'fr-FR' })

  test('validates an email verification link', async ({ page }) => {
    await preferFrench(page)
    await mockFirebaseEmailActionSuccess(page)

    await page.goto('/auth/action?mode=verifyEmail&oobCode=test-code&continueUrl=%2Fauth%2Fsignin')

    await expect(page.getByText('Adresse email vérifiée. Tu peux continuer sur BodyOps.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continuer' })).toBeVisible()
  })

  test('shows and confirms password reset', async ({ page }) => {
    await preferFrench(page)
    await mockFirebaseEmailActionSuccess(page)

    await page.goto('/auth/action?mode=resetPassword&oobCode=reset-code&continueUrl=%2Fauth%2Fsignin')

    await expect(page.getByText('Réinitialisation pour member@example.com')).toBeVisible()
    await page.getByLabel('Nouveau mot de passe').fill('password123')
    await page.getByLabel('Confirmer').fill('password123')
    await page.getByRole('button', { name: 'Mettre à jour' }).click()

    await expect(page.getByText('Mot de passe mis à jour. Tu peux te connecter avec ton nouveau mot de passe.')).toBeVisible()
  })
})
