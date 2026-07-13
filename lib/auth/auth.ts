import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma/client'
import { sessionCallback } from '@/lib/auth/session-callbacks'

const baseAdapter = PrismaAdapter(prisma)

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret:    process.env.AUTH_SECRET,
  trustHost: true,
  adapter:   baseAdapter,

  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',        type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null

          const user = await prisma.user.findUnique({
            where:  { email: credentials.email as string },
            select: { id: true, email: true, name: true, image: true, password: true },
          })

          if (!user?.password) return null

          // Load bcrypt only inside the credentials route to keep middleware Edge-compatible.
          const { compare } = await import('bcryptjs')
          const valid = await compare(credentials.password as string, user.password)
          if (!valid) return null

          return { id: user.id, email: user.email, name: user.name, image: user.image }
        } catch (err) {
          console.error('[auth] authorize error:', err)
          return null
        }
      },
    }),

    Credentials({
      id: 'firebase-handoff',
      name: 'firebase-handoff',
      credentials: {
        token: { label: 'Firebase handoff token', type: 'text' },
      },
      async authorize(credentials) {
        try {
          const token = credentials?.token
          if (typeof token !== 'string' || !token.trim()) return null

          const handoff = await prisma.authHandoffToken.findUnique({
            where:   { token },
            include: { user: true },
          })
          if (!handoff || handoff.expiresAt < new Date()) {
            if (handoff) await prisma.authHandoffToken.delete({ where: { id: handoff.id } }).catch(() => {})
            return null
          }

          await prisma.authHandoffToken.delete({ where: { id: handoff.id } })
          await prisma.user.update({
            where: { id: handoff.userId },
            data:  { lastLoginAt: new Date() },
          }).catch(() => {})

          return { id: handoff.user.id, email: handoff.user.email, name: handoff.user.name, image: handoff.user.image }
        } catch (err) {
          console.error('[auth] firebase handoff error:', err)
          return null
        }
      },
    }),

  ],

  pages: {
    signIn: '/auth/signin',
    error:  '/auth/signin',
  },

  callbacks: {
    async jwt({ token, user }) {
      // Only query the DB on sign-in (user object present), not on every auth() call.
      // Token fields persist in the signed JWT cookie; no need to re-fetch each request.
      if (user?.id) {
        token.userId = user.id
        const isEdgeRuntime = typeof (globalThis as { EdgeRuntime?: string }).EdgeRuntime === 'string'
        if (!isEdgeRuntime) {
          const dbUser = await prisma.user.findUnique({
            where:  { id: user.id },
            select: {
              subscriptionPlan:   true,
              subscriptionStatus: true,
              profile:            { select: { id: true } },
              coachProfile:       { select: { id: true } },
            },
          })
          token.plan             = dbUser?.subscriptionPlan   ?? 'FREE'
          token.status           = dbUser?.subscriptionStatus ?? 'INACTIVE'
          token.isCoach          = !!dbUser?.coachProfile
          token.hasRoleConflict  = !!dbUser?.coachProfile && !!dbUser?.profile
          token.hasMemberProfile = !!dbUser?.profile
        }
      }
      return token
    },

    session: sessionCallback,
  },

  session: {
    strategy:  'jwt',
    maxAge:    30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,      // Refreshes the token once per day.
  },

  events: {
    async createUser({ user }) {
      await prisma.subscription.create({
        data: { userId: user.id!, plan: 'FREE', status: 'INACTIVE' },
      })
    },
  },
})
