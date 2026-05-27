import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'
import type { NextAuthRequest } from 'next-auth'

const PUBLIC_ROUTES = [
  '/',
  '/auth/signin',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/error',
  '/pricing',
  '/onboarding',
  '/choose',
  '/coaches',
  '/coaching/status',
]

const PUBLIC_PREFIXES = [
  '/auth/register/',
  '/coaches/',
]

const COACH_PREFIXES = [
  '/coach',
  '/api/coach',
]

const MEMBER_PREFIXES = [
  '/dashboard',
  '/training',
  '/nutrition',
  '/progress',
  '/appointments',
  '/notes',
  '/ai',
  '/exports',
  '/shop',
  '/integrations',
  '/settings',
  '/choose',
  '/coaching/status',
  '/onboarding',
  '/api/user/appointments',
  '/api/user/coach-notes',
  '/api/user/metrics',
  '/api/user/my-coach',
  '/api/user/notes',
  '/api/user/notifications',
  '/api/user/profile',
  '/api/user/training',
]

/** Next.js middleware: enforces auth, role-based routing (coach vs member), and public-route bypass. */
export default auth((req: NextAuthRequest) => {
  const { pathname } = req.nextUrl
  const session      = req.auth

  // Static assets and auth API routes stay public.
  if (pathname.startsWith('/api/auth')) return NextResponse.next()

  if (session?.user) {
    const isCoach = session.user.isCoach === true
    const isCoachRoute = COACH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    const isMemberRoute = MEMBER_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))

    if (isCoach && isMemberRoute) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Accès réservé aux membres.' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/coach/dashboard', req.url))
    }

    if (!isCoach && isCoachRoute) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Accès réservé aux coachs.' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // Public routes are needed for local-first onboarding.
  if (PUBLIC_ROUTES.includes(pathname) || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  // Authenticated app routes redirect to sign-in.
  if (!session?.user) {
    const url = new URL('/auth/signin', req.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // All features are free for now, so there is no premium gate here.
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|images|manifest.json|sw.js).*)'],
}
