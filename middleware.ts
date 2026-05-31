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
  '/terms',
  '/privacy',
]

const PUBLIC_PREFIXES = [
  '/auth/register/',
  '/coaches/',
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
  '/api/user/apple-health-token',
  '/api/user/training',
]

/** Next.js middleware: enforces auth, role-based routing (coach vs member), and public-route bypass. */
export default auth((req: NextAuthRequest) => {
  const { pathname } = req.nextUrl
  const session      = req.auth

  // Static assets and auth API routes stay public.
  if (pathname.startsWith('/api/auth')) return NextResponse.next()

  // Webhook endpoints that use Bearer token auth bypass session middleware.
  if (pathname === '/api/user/metrics/apple-health') return NextResponse.next()

  if (session?.user) {
    const isCoach = session.user.isCoach === true
    const hasMemberProfile = session.user.hasMemberProfile === true
    const isMemberRoute = MEMBER_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))

    // Coach-only accounts stay out of member screens, but dual member+coach
    // accounts can switch between both spaces from the same email.
    const isMemberBootstrap = pathname === '/onboarding' || pathname === '/choose' || pathname === '/api/user/profile'

    if (isCoach && !hasMemberProfile && isMemberRoute && !isMemberBootstrap) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Accès réservé aux membres.' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/coach/dashboard', req.url))
    }

    // Coach pages and APIs verify CoachProfile from the database themselves.
    // Middleware only prevents coach-only accounts from entering member pages.
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
  // Exclude static assets AND webhook endpoints that use their own Bearer token auth.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|images|manifest.json|sw.js|api/user/metrics/apple-health).*)'],
}
