/** @type {import('next').NextConfig} */

// Validate required environment variables only during production builds, not lint/tests.
if (process.env.NEXT_PHASE === 'phase-production-build') {
  const REQUIRED = [
    'DATABASE_URL',
    'AUTH_SECRET',
    'NEXT_PUBLIC_APP_URL',
  ]
  const missing = REQUIRED.filter((k) => !process.env[k])
  if (missing.length > 0) {
    console.error('\nMissing environment variables - build cancelled:')
    missing.forEach((k) => console.error(`   ✗  ${k}`))
    console.error('\nAdd them in Vercel -> Settings -> Environment Variables.\n')
    process.exit(1)
  }
}

const enablePWA = process.env.ENABLE_PWA === 'true'

const withPWA = require('next-pwa')({
  dest:            'public',
  disable:         !enablePWA,
  register:        true,
  skipWaiting:     true,
  runtimeCaching:  [],
})

const nextConfig = {
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

module.exports = withPWA(nextConfig)
