import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'
import { getLandingPath } from '@/lib/auth/landing'

type CollectedCookie = { name: string; value: string; options: Partial<CookieOptions> }

function makeSupabase(request: NextRequest, cookies: CollectedCookie[]) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) { cookies.push(...cookiesToSet) },
      },
    }
  )
}

function applyCollectedCookies(response: NextResponse, cookies: CollectedCookie[]) {
  cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const errorParam = searchParams.get('error')

  if (errorParam) {
    return NextResponse.redirect(`${origin}/auth/error?reason=link_expired`)
  }

  // PKCE flow (OAuth, magic link via code)
  if (code) {
    const collected: CollectedCookie[] = []
    const supabase = makeSupabase(request, collected)
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && user) {
      const landing = await getLandingPath(user.id)
      const response = NextResponse.redirect(`${origin}${landing}`)
      applyCollectedCookies(response, collected)
      return response
    }
    return NextResponse.redirect(`${origin}/auth/error?reason=link_expired`)
  }

  // OTP / invite flow (token_hash + type)
  if (tokenHash && type) {
    const collected: CollectedCookie[] = []
    const supabase = makeSupabase(request, collected)
    const { data: { user }, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'invite' | 'magiclink' | 'recovery' | 'email',
    })
    if (!error && user) {
      const destination = type === 'invite'
        ? `${origin}/accept-invite`
        : `${origin}${await getLandingPath(user.id)}`
      const response = NextResponse.redirect(destination)
      applyCollectedCookies(response, collected)
      return response
    }
    return NextResponse.redirect(`${origin}/auth/error?reason=link_expired`)
  }

  // No code, token_hash, or error — link is invalid or user navigated directly
  return NextResponse.redirect(`${origin}/auth/error?reason=invalid_link`)
}
