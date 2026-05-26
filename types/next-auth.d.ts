// Extension des types NextAuth pour inclure plan et status dans la session

import type { DefaultSession, DefaultJWT } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id:      string
      plan:    string
      status:  string
      isCoach: boolean
      hasMemberProfile: boolean
    } & DefaultSession['user']
  }

  interface User {
    plan?:   string
    status?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    userId?:  string
    plan?:    string
    status?:  string
    isCoach?: boolean
    hasMemberProfile?: boolean
  }
}
