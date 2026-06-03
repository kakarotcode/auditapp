import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

// Routes that are publicly accessible without authentication
const PUBLIC_API_PREFIXES = [
  '/api/auth',
  '/api/webhooks',
  '/api/health',
  // Razorpay calls this server-to-server (no session); it verifies its own
  // HMAC signature, so it must be reachable without auth.
  '/api/billing/webhook',
]

// Static asset paths to skip entirely
const STATIC_PATH_PREFIXES = [
  '/_next',
  '/favicon',
  '/public',
  '/images',
  '/icons',
]

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function isStaticAsset(pathname: string): boolean {
  return STATIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip static assets and Next.js internals
  if (isStaticAsset(pathname)) {
    return NextResponse.next()
  }

  // Skip public API routes (auth callbacks, webhooks)
  if (pathname.startsWith('/api/') && isPublicApiRoute(pathname)) {
    return NextResponse.next()
  }

  // Protect /api/* routes (except whitelisted ones above)
  if (pathname.startsWith('/api/')) {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }
    return NextResponse.next()
  }

  // Protect /dashboard/* routes — redirect to /login if not authenticated
  if (pathname.startsWith('/dashboard')) {
    const session = await auth()
    if (!session?.user?.id) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', req.url)
      return NextResponse.redirect(loginUrl)
    }

    // If onboarding is not done, redirect to /onboarding
    // We check this only on dashboard routes to avoid infinite redirects
    const onboardingDone = session.user as { onboardingDone?: boolean } & typeof session.user
    if (
      typeof (onboardingDone as unknown as Record<string, unknown>).onboardingDone === 'boolean' &&
      !(onboardingDone as unknown as Record<string, unknown>).onboardingDone &&
      !pathname.startsWith('/dashboard/onboarding')
    ) {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }

    return NextResponse.next()
  }

  // Redirect authenticated users away from auth pages
  if (pathname === '/login' || pathname === '/signup' || pathname === '/') {
    const session = await auth()
    if (session?.user?.id) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
