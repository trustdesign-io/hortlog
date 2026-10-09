import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const errorParam = searchParams.get('error')

  if (errorParam) {
    return NextResponse.redirect(`${origin}/sign-in?error=${errorParam}`)
  }

  // PKCE flow (OAuth, magic link via code)
  if (code) {
    const redirectTo = NextResponse.redirect(`${origin}/records`)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              redirectTo.cookies.set(name, value, options)
            )
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return redirectTo
    return NextResponse.redirect(`${origin}/auth/error?reason=link_expired`)
  }

  // OTP / invite flow (token_hash + type)
  if (tokenHash && type) {
    const destination = type === 'invite' ? `${origin}/accept-invite` : `${origin}/records`
    const redirectTo = NextResponse.redirect(destination)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              redirectTo.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'invite' | 'magiclink' | 'recovery' | 'email',
    })

    if (!error) return redirectTo
    return NextResponse.redirect(`${origin}/auth/error?reason=link_expired`)
  }

  // No code, token_hash, or error — link is invalid or user navigated directly
  return NextResponse.redirect(`${origin}/auth/error?reason=invalid_link`)
}
