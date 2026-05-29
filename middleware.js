import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE_NAME = 'ff_token'
const JWT_SECRET = process.env.JWT_SECRET || 'FocusTube-dev-secret-change-in-production'

const PROTECTED_ROUTES = ['/library', '/watch', '/completed', '/notes']
const AUTH_ROUTES = ['/login', '/signup']

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(COOKIE_NAME)?.value

  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r))
  const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r))

  let user = null
  if (token) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET))
      user = payload
    } catch {
      // Invalid token — clear it
      const res = NextResponse.redirect(new URL('/login', request.url))
      res.cookies.delete(COOKIE_NAME)
      return res
    }
  }

  // Redirect unauthenticated users away from protected pages
  if (isProtected && !user) {
    const url = new URL('/login', request.url)
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login/signup
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/library', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/library/:path*',
    '/watch/:path*',
    '/completed/:path*',
    '/notes/:path*',
    '/login',
    '/signup',
  ],
}
