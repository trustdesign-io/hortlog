import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/records', '/settings', '/admin', '/orgs']
const SIGN_IN_ONLY = ['/sign-in', '/sign-up']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: auth.getUser() must be called immediately after createServerClient
  // to ensure the session cookie is refreshed on every request.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
  const isSignInRoute = SIGN_IN_ONLY.includes(pathname)

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }
  if (isSignInRoute && user) {
    return NextResponse.redirect(new URL('/records', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|v/|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
