import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const protectedPaths = ['/dashboard', '/settings']
  const isAppRoute = protectedPaths.some((p) => pathname.startsWith(p))
  const isAuthRoute = pathname === '/sign-in' || pathname === '/sign-up'

  // Check for Supabase session cookie (handles chunked .0/.1 format)
  const hasSession = request.cookies.getAll()
    .some(c => c.name.startsWith('sb-') && c.name.includes('auth-token'))

  if (isAppRoute && !hasSession) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }
  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|auth/callback|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
