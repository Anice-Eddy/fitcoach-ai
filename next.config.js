/** @type {import('next').NextConfig} */

// Validate required environment variables only during production builds, not lint/tests.
if (process.env.NEXT_PHASE === 'phase-production-build') {
  const REQUIRED = [
    'DATABASE_URL',
    'AUTH_SECRET',
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ]
  const missing = REQUIRED.filter((k) => !process.env[k])
  if (missing.length > 0) {
    console.error('\nMissing environment variables - build cancelled:')
    missing.forEach((k) => console.error(`   ✗  ${k}`))
    console.error('\nAdd them in Vercel -> Settings -> Environment Variables.\n')
    process.exit(1)
  }
}

const { version: packageVersion } = require('./package.json')

const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION ?? packageVersion,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'graph.facebook.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'www.nutrimuscle.com' },
    ],
  },
  // CORS headers for Stripe webhooks at /api/stripe/webhook.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
        ],
      },
      {
        source: '/api/stripe/webhook',
        headers: [{ key: 'Content-Type', value: 'text/plain' }],
      },
    ]
  },
}

module.exports = nextConfig
