export type AuthProviderMode = 'firebase' | 'nextauth' | 'hybrid'

export function normalizeAuthProviderMode(value?: string | null): AuthProviderMode {
  if (value === 'firebase' || value === 'nextauth' || value === 'hybrid') return value
  return 'hybrid'
}

export function authProviderMode(): AuthProviderMode {
  return normalizeAuthProviderMode(process.env.AUTH_PROVIDER ?? process.env.NEXT_PUBLIC_AUTH_PROVIDER)
}

export function publicAuthProviderMode(): AuthProviderMode {
  return normalizeAuthProviderMode(process.env.NEXT_PUBLIC_AUTH_PROVIDER ?? process.env.AUTH_PROVIDER)
}

export function canUseFirebaseAuth(mode: AuthProviderMode) {
  return mode === 'firebase' || mode === 'hybrid'
}

export function canUseNextAuth(mode: AuthProviderMode) {
  return mode === 'nextauth' || mode === 'hybrid'
}
