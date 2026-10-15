import { NextResponse, type NextRequest } from 'next/server'

/**
 * Printed QR labels encode their link in capitals (HTTPS://HORTLOG.COM/V/ABC123)
 * so the code stays small. Send those to the lowercase short link.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (!pathname.startsWith('/V/')) return NextResponse.next()
  const url = request.nextUrl.clone()
  url.pathname = `/v/${pathname.slice(3).toLowerCase()}`
  return NextResponse.redirect(url, 308)
}

export const config = { matcher: ['/V/:path*'] }
