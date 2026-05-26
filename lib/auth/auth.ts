import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma/client'

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret:  process.env.AUTH_SECRET,
  adapter: PrismaAdapter(prisma),

  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    Credentials({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',        type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user?.password) return null

        const valid = await compare(credentials.password as string, user.password)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name, image: user.image }
      },
    }),
  ],

  pages: {
    signIn: '/auth/signin',
    error:  '/auth/signin',
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id
        const dbUser = await prisma.user.findUnique({
          where:  { id: user.id },
          select: { subscriptionPlan: true, subscriptionStatus: true },
        })
        token.plan   = dbUser?.subscriptionPlan   ?? 'FREE'
        token.status = dbUser?.subscriptionStatus ?? 'INACTIVE'
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id     = (token.userId ?? '') as string
        session.user.plan   = (token.plan   ?? 'FREE') as string
        session.user.status = (token.status ?? 'INACTIVE') as string
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
