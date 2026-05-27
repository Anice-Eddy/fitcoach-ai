const REQUIRED_ENV_VARS = [
  { key: 'DATABASE_URL',      desc: 'Connexion PostgreSQL' },
  { key: 'AUTH_SECRET',       desc: 'Secret next-auth (sessions & JWT)' },
  { key: 'GOOGLE_CLIENT_ID',  desc: 'OAuth Google — client ID' },
  { key: 'GOOGLE_CLIENT_SECRET', desc: 'OAuth Google — secret' },
  { key: 'NEXT_PUBLIC_APP_URL',  desc: 'URL publique de l\'app' },
] as const

/** Throws a descriptive error listing all required environment variables that are currently missing. */
export function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter(({ key }) => !process.env[key])

  if (missing.length > 0) {
    const lines = missing.map(({ key, desc }) => `  ✗ ${key}  →  ${desc}`)
    throw new Error(
      `\n\n❌ Variables d'environnement manquantes :\n${lines.join('\n')}\n\n` +
      `Ajoute-les dans Vercel → Settings → Environment Variables\n`,
    )
  }
}

export const env = {
  DATABASE_URL:           process.env.DATABASE_URL!,
  AUTH_SECRET:            process.env.AUTH_SECRET!,
  GOOGLE_CLIENT_ID:       process.env.GOOGLE_CLIENT_ID!,
  GOOGLE_CLIENT_SECRET:   process.env.GOOGLE_CLIENT_SECRET!,
  NEXT_PUBLIC_APP_URL:    process.env.NEXT_PUBLIC_APP_URL!,
  STRIPE_SECRET_KEY:      process.env.STRIPE_SECRET_KEY ?? 'sk_disabled',
  STRIPE_WEBHOOK_SECRET:  process.env.STRIPE_WEBHOOK_SECRET ?? 'whsec_disabled',
}
