import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'
import type { NextAuthRequest } from 'next-auth'

const PUBLIC_ROUTES = [
  '/',
  '/auth/signin',
  '/auth/register',
  '/auth/error',
]

export default auth((req: NextAuthRequest) => {
  const { pathname } = req.nextUrl
  const session      = req.auth

  // Assets statiques et routes API auth
  if (pathname.startsWith('/api/auth')) return NextResponse.next()

  // Routes publiques
  if (PUBLIC_ROUTES.includes(pathname)) return NextResponse.next()

  // Redirige vers signin si non connecté
  if (!session?.user) {
    const url = new URL('/auth/signin', req.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // Toutes les fonctionnalités sont gratuites — pas de gate premium
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|images|manifest.json|sw.js).*)'],
}
