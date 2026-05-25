/** @type {import('next').NextConfig} */
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
      { protocol: 'https', hostname: 'via.placeholder.com' },
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
