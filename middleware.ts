import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'
import type { NextAuthRequest } from 'next-auth'

const PUBLIC_ROUTES = [
  '/',
  '/auth/signin',
  '/auth/register',
  '/auth/error',
  '/pricing',
  '/onboarding',
  '/choose',
  '/coaching/status',
]

const PUBLIC_PREFIXES = [
  '/coaches/',
]

export default auth((req: NextAuthRequest) => {
  const { pathname } = req.nextUrl
  const session      = req.auth

  // Static assets and auth API routes stay public.
  if (pathname.startsWith('/api/auth')) return NextResponse.next()

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
