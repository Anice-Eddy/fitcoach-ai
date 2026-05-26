/** @type {import('next').NextConfig} */

// Validation des variables d'environnement obligatoires au moment du build
if (process.env.NODE_ENV === 'production') {
  const REQUIRED = [
    'DATABASE_URL',
    'AUTH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'NEXT_PUBLIC_APP_URL',
  ]
  const missing = REQUIRED.filter((k) => !process.env[k])
  if (missing.length > 0) {
    console.error('\n❌ Variables d\'environnement manquantes — build annulé :')
    missing.forEach((k) => console.error(`   ✗  ${k}`))
    console.error('\nAjoute-les dans Vercel → Settings → Environment Variables\n')
    process.exit(1)
  }
}

const withPWA = require('next-pwa')({
  dest:            'public',
  disable:         process.env.NODE_ENV === 'development',
  register:        true,
  skipWaiting:     true,
  runtimeCaching:  [],
})

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  // Headers CORS pour les webhooks Stripe (route /api/stripe/webhook)
  async headers() {
    return [
      {
        source: '/api/stripe/webhook',
        headers: [{ key: 'Content-Type', value: 'text/plain' }],
      },
    ]
  },
}

module.exports = withPWA(nextConfig)
