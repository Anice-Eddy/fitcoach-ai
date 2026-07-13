import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const authUser = {
    displayName: null,
    email:       'eddy@example.com',
    getIdToken:  vi.fn(),
  }

  return {
    authUser,
    authMock:                    { currentUser: authUser },
    sendEmailVerificationMock:   vi.fn(),
    sendPasswordResetEmailMock:  vi.fn(),
    verifyBeforeUpdateEmailMock: vi.fn(),
    applyActionCodeMock:         vi.fn(),
    checkActionCodeMock:         vi.fn(),
    confirmPasswordResetMock:    vi.fn(),
    verifyPasswordResetCodeMock: vi.fn(),
    reloadMock:                  vi.fn(),
  }
})

vi.mock('firebase/app', () => ({
  getApp:        vi.fn(() => ({})),
  getApps:       vi.fn(() => [{}]),
  initializeApp: vi.fn(() => ({})),
}))

vi.mock('firebase/auth', () => ({
  getAuth:                      vi.fn(() => mocks.authMock),
  sendEmailVerification:        mocks.sendEmailVerificationMock,
  sendPasswordResetEmail:       mocks.sendPasswordResetEmailMock,
  signInWithEmailAndPassword:   vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithPopup:              vi.fn(),
  updateProfile:                vi.fn(),
  verifyBeforeUpdateEmail:      mocks.verifyBeforeUpdateEmailMock,
  applyActionCode:              mocks.applyActionCodeMock,
  checkActionCode:              mocks.checkActionCodeMock,
  confirmPasswordReset:         mocks.confirmPasswordResetMock,
  verifyPasswordResetCode:      mocks.verifyPasswordResetCodeMock,
  reload:                       mocks.reloadMock,
  GoogleAuthProvider:           vi.fn(),
  FacebookAuthProvider:         vi.fn(),
}))

let firebaseClient: typeof import('@/lib/firebase/client')

describe('firebase client auth helpers', () => {
  beforeAll(async () => {
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-key'
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'bodyops.test'
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'bodyops-test'
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'app-id'
    firebaseClient = await import('@/lib/firebase/client')
  })

  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState(null, '', 'http://localhost:3000/settings/profile')
  })

  it('sends email verification with a BodyOps return URL', async () => {
    await firebaseClient.firebaseSendCurrentUserEmailVerification('/settings/profile')

    expect(mocks.sendEmailVerificationMock).toHaveBeenCalledWith(mocks.authUser, {
      url:             'http://localhost:3000/settings/profile',
      handleCodeInApp: false,
    })
  })

  it('requests an email change through verification before updating', async () => {
    await firebaseClient.firebaseRequestEmailChange('new@example.com', '/settings/profile')

    expect(mocks.verifyBeforeUpdateEmailMock).toHaveBeenCalledWith(mocks.authUser, 'new@example.com', {
      url:             'http://localhost:3000/settings/profile',
      handleCodeInApp: false,
    })
  })

  it('sends password reset with a return URL to sign-in', async () => {
    await firebaseClient.firebaseForgotPassword('eddy@example.com')

    expect(mocks.sendPasswordResetEmailMock).toHaveBeenCalledWith(mocks.authMock, 'eddy@example.com', {
      url:             'http://localhost:3000/auth/signin',
      handleCodeInApp: false,
    })
  })

  it('exposes Firebase actions used by the email action handler', async () => {
    await firebaseClient.firebaseCheckActionCode('code-1')
    await firebaseClient.firebaseApplyActionCode('code-2')
    await firebaseClient.firebaseVerifyPasswordResetCode('code-3')
    await firebaseClient.firebaseConfirmPasswordReset('code-4', 'password123')

    expect(mocks.checkActionCodeMock).toHaveBeenCalledWith(mocks.authMock, 'code-1')
    expect(mocks.applyActionCodeMock).toHaveBeenCalledWith(mocks.authMock, 'code-2')
    expect(mocks.verifyPasswordResetCodeMock).toHaveBeenCalledWith(mocks.authMock, 'code-3')
    expect(mocks.confirmPasswordResetMock).toHaveBeenCalledWith(mocks.authMock, 'code-4', 'password123')
  })

  it('reloads the current user before returning the token', async () => {
    mocks.authUser.getIdToken.mockResolvedValue('fresh-token')

    await expect(firebaseClient.firebaseCurrentUserIdToken(true)).resolves.toBe('fresh-token')
    expect(mocks.reloadMock).toHaveBeenCalledWith(mocks.authUser)
    expect(mocks.authUser.getIdToken).toHaveBeenCalledWith(true)
  })
})
