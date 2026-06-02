import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma/client'

const baseAdapter = PrismaAdapter(prisma)

/**
 * Custom adapter that auto-heals a stale Google account link.
 * NextAuth throws OAuthAccountNotLinked when an Account(Google) row points
 * to a different userId than the user found by email.  We fix this by
 * re-linking the account inside getUserByAccount before NextAuth compares
 * the two users — so both lookups return the same user and the error never fires.
 */
const healingAdapter = {
  ...baseAdapter,
  async getUserByAccount(providerAccount: { provider: string; providerAccountId: string }) {
    const account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider:          providerAccount.provider,
          providerAccountId: providerAccount.providerAccountId,
        },
      },
      include: { user: true },
    })
    if (!account) return null

    // Find the canonical user for this email
    const canonical = account.user?.email
      ? await prisma.user.findUnique({ where: { email: account.user.email } })
      : null

    if (canonical && canonical.id !== account.userId) {
      // Stale link — re-point the account to the canonical user
      await prisma.account.update({
        where: { id: account.id },
        data:  { userId: canonical.id },
      })
      return canonical
    }

    return account.user
  },
}

function getProfileEmail(profile: unknown) {
  const email = (profile as { email?: unknown } | null)?.email
  return typeof email === 'string' ? email.toLowerCase() : null
}

function getProfileName(profile: unknown) {
  const name = (profile as { name?: unknown } | null)?.name
  return typeof name === 'string' ? name : null
}

function getProfileImage(profile: unknown) {
  const picture = (profile as { picture?: unknown; image?: unknown } | null)?.picture
    ?? (profile as { image?: unknown } | null)?.image
  return typeof picture === 'string' ? picture : null
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret:    process.env.AUTH_SECRET,
  trustHost: true,
  adapter:   healingAdapter,

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
    async signIn({ user, account, profile }) {
      if (account?.provider !== 'google' || !user.email) return true
      try {
        const googleEmail = getProfileEmail(profile)
        const linkedAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider:          'google',
              providerAccountId: account.providerAccountId,
            },
          },
          include: { user: true },
        })

        if (googleEmail && linkedAccount && linkedAccount.user.email.toLowerCase() !== googleEmail) {
          const target = await prisma.user.upsert({
            where:  { email: googleEmail },
            update: {
              name:     getProfileName(profile)  ?? undefined,
              image:    getProfileImage(profile) ?? undefined,
              provider: 'GOOGLE',
            },
            create: {
              email:    googleEmail,
              name:     getProfileName(profile),
              image:    getProfileImage(profile),
              provider: 'GOOGLE',
              subscription: {
                create: { plan: 'FREE', status: 'INACTIVE' },
              },
            },
          })

          await prisma.account.update({
            where: { id: linkedAccount.id },
            data:  { userId: target.id },
          })

          // Make the current OAuth callback continue with the corrected user.
          user.id = target.id
          user.email = target.email
          user.name = target.name
          user.image = target.image
          return true
        }

        const existing = await prisma.user.findUnique({
          where:   { email: user.email },
          include: { accounts: { where: { provider: 'google' } } },
        })
        if (!existing) return true

        const linked = existing.accounts[0]
        if (linked && linked.userId !== existing.id) {
          // Stale account record pointing to wrong userId — re-link it
          await prisma.account.update({
            where: { id: linked.id },
            data:  { userId: existing.id },
          })
        }

        if (!linked) {
          // Email exists (email/password) but no Google account linked yet — create the link
          await prisma.account.create({
            data: {
              userId:            existing.id,
              type:              account.type,
              provider:          'google',
              providerAccountId: account.providerAccountId,
              access_token:      account.access_token  ?? null,
              refresh_token:     account.refresh_token ?? null,
              expires_at:        account.expires_at    ?? null,
              token_type:        account.token_type    ?? null,
              scope:             account.scope         ?? null,
              id_token:          account.id_token      ?? null,
            },
          })
        }
      } catch (err) {
        console.error('[auth] signIn link error:', err)
      }
      return true
    },

    async jwt({ token, user }) {
      // Only query the DB on sign-in (user object present) — NOT on every auth() call.
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

    async session({ session, token }) {
      if (session.user) {
        session.user.id      = (token.userId  ?? '') as string
        session.user.plan    = (token.plan    ?? 'FREE') as string
        session.user.status  = (token.status  ?? 'INACTIVE') as string
        session.user.isCoach = (token.isCoach ?? false) as boolean
        session.user.hasRoleConflict = (token.hasRoleConflict ?? false) as boolean
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
