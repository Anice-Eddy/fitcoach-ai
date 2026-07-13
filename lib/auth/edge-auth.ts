import NextAuth from 'next-auth'
import { sessionCallback } from '@/lib/auth/session-callbacks'

// Middleware still relies on Auth.js to read the encrypted session cookie at the edge.
// The build can show a jose Edge Runtime warning, but the verified build and E2E flow remain valid.
export const { auth } = NextAuth({
  secret:    process.env.AUTH_SECRET,
  trustHost: true,
  providers: [],

  callbacks: {
    session: sessionCallback,
  },

  session: {
    strategy: 'jwt',
  },
})
