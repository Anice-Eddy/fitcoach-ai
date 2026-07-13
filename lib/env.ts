const REQUIRED_ENV_VARS = [
  { key: 'DATABASE_URL',      desc: 'PostgreSQL connection' },
  { key: 'AUTH_SECRET',       desc: 'NextAuth secret for sessions and JWT' },
  { key: 'NEXT_PUBLIC_APP_URL',  desc: 'Public app URL' },
] as const

/** Throws a descriptive error listing all required environment variables that are currently missing. */
export function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter(({ key }) => !process.env[key])

  if (missing.length > 0) {
    const lines = missing.map(({ key, desc }) => `  ✗ ${key}  →  ${desc}`)
    throw new Error(
      `\n\nMissing environment variables:\n${lines.join('\n')}\n\n` +
      `Add them in Vercel -> Settings -> Environment Variables\n`,
    )
  }
}

export const env = {
  DATABASE_URL:           process.env.DATABASE_URL!,
  AUTH_SECRET:            process.env.AUTH_SECRET!,
  NEXT_PUBLIC_APP_URL:    process.env.NEXT_PUBLIC_APP_URL!,
  AUTH_PROVIDER:          process.env.AUTH_PROVIDER ?? 'firebase',
  NEXT_PUBLIC_AUTH_PROVIDER: process.env.NEXT_PUBLIC_AUTH_PROVIDER ?? process.env.AUTH_PROVIDER ?? 'firebase',
  STRIPE_SECRET_KEY:      process.env.STRIPE_SECRET_KEY ?? 'sk_disabled',
  STRIPE_WEBHOOK_SECRET:  process.env.STRIPE_WEBHOOK_SECRET ?? 'whsec_disabled',
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  FIREBASE_ADMIN_PROJECT_ID: process.env.FIREBASE_ADMIN_PROJECT_ID,
  FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
  NEXT_PUBLIC_FACEBOOK_APP_ID: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET,
}
