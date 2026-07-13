import type { NextAuthConfig } from 'next-auth'

/** Copies BodyOps-specific JWT fields onto the public session object. */
export const sessionCallback: NonNullable<NextAuthConfig['callbacks']>['session'] = async ({ session, token }) => {
  if (session.user) {
    session.user.id      = (token.userId  ?? '') as string
    session.user.plan    = (token.plan    ?? 'FREE') as string
    session.user.status  = (token.status  ?? 'INACTIVE') as string
    session.user.isCoach = (token.isCoach ?? false) as boolean
    session.user.hasRoleConflict = (token.hasRoleConflict ?? false) as boolean
    session.user.hasMemberProfile = (token.hasMemberProfile ?? false) as boolean
  }
  return session
}
