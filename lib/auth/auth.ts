import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma/client'

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret:    process.env.AUTH_SECRET,
  trustHost: true,
  adapter:   PrismaAdapter(prisma),

  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    Credentials({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',        type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null

          const user = await prisma.user.findUnique({
            where:  { email: credentials.email as string },
            select: { id: true, email: true, name: true, image: true, password: true },
          })

          if (!user?.password) return null

          const valid = await compare(credentials.password as string, user.password)
          if (!valid) return null

          return { id: user.id, email: user.email, name: user.name, image: user.image }
        } catch (err) {
          console.error('[auth] authorize error:', err)
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
      const rawUserId = user?.id ?? token.userId
      const userId = typeof rawUserId === 'string' ? rawUserId : undefined
      if (userId) {
        token.userId = userId
        const dbUser = await prisma.user.findUnique({
          where:  { id: userId },
          select: {
            subscriptionPlan: true,
            subscriptionStatus: true,
            profile: { select: { id: true } },
            coachProfile: { select: { id: true } },
          },
        })
        token.plan             = dbUser?.subscriptionPlan   ?? 'FREE'
        token.status           = dbUser?.subscriptionStatus ?? 'INACTIVE'
        token.isCoach          = !!dbUser?.coachProfile
        token.hasMemberProfile = !!dbUser?.profile
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id      = (token.userId  ?? '') as string
        session.user.plan    = (token.plan    ?? 'FREE') as string
        session.user.status  = (token.status  ?? 'INACTIVE') as string
        session.user.isCoach = (token.isCoach ?? false) as boolean
        session.user.hasMemberProfile = (token.hasMemberProfile ?? false) as boolean
      }
      return session
    },
  },

  session: {
    strategy:  'jwt',
    maxAge:    30 * 24 * 60 * 60, // 30 jours
    updateAge: 24 * 60 * 60,      // renouvelle le token 1x par jour
  },

  events: {
    async createUser({ user }) {
      await prisma.subscription.create({
        data: { userId: user.id!, plan: 'FREE', status: 'INACTIVE' },
      })
    },
  },
})
