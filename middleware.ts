// Middleware Next.js — protection des routes et vérification du plan premium
// S'exécute sur le Edge Runtime (pas d'import Prisma ici)

import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'
import type { NextAuthRequest } from 'next-auth'

// Routes accessibles sans authentification
const PUBLIC_ROUTES  = ['/', '/pricing', '/auth/signin', '/auth/register', '/auth/error']
// Routes nécessitant un plan Pro ou supérieur
const PREMIUM_ROUTES = ['/exports', '/nutrition/shopping-list']

export default auth((req: NextAuthRequest) => {
  const { pathname } = req.nextUrl
  const session      = req.auth

  // Autorise les routes publiques et les assets statiques
  if (PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Redirige vers signin si non connecté et route (app) protégée
  if (!session?.user && !pathname.startsWith('/coach')) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  // Vérifie le plan premium pour les routes premium
  const isPremiumRoute = PREMIUM_ROUTES.some((r) => pathname.startsWith(r))
  const plan = (session?.user as { plan?: string } | undefined)?.plan
  if (isPremiumRoute && plan === 'FREE') {
    return NextResponse.redirect(new URL('/pricing?reason=premium_required', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|images|manifest.json|sw.js).*)'],
}
