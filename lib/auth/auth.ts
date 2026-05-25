// NextAuth v5 — configuration Google + GitHub
// deps: npm install next-auth@beta @auth/prisma-adapter

import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import { prisma } from '@/lib/prisma/client'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId:     process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],

  pages: {
    signIn: '/auth/signin',
    error:  '/auth/signin',
  },

  callbacks: {
    // Injecte le plan Stripe et l'ID utilisateur dans le token JWT
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

    // Expose le plan dans la session côté client
    async session({ session, token }) {
      if (session.user) {
        session.user.id     = (token.userId ?? '') as string
        session.user.plan   = (token.plan   ?? 'FREE') as string
        session.user.status = (token.status ?? 'INACTIVE') as string
      }
      return session
    },
  },

  session: { strategy: 'jwt' },

  events: {
    // Crée un profil vide + abonnement FREE à la première connexion
    async createUser({ user }) {
      await prisma.subscription.create({
        data: { userId: user.id!, plan: 'FREE', status: 'INACTIVE' },
      })
    },
  },
})
