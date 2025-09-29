// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for API routes, static files, and auth pages
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') ||
    pathname === '/login'
  ) {
    return NextResponse.next()
  }

  console.log('🔍 Middleware: Checking access for:', pathname)
  
  const refreshToken = request.cookies.get('refreshToken')?.value
  
  // Public routes that don't require auth
  const publicRoutes = ['/login']
  const isPublicRoute = publicRoutes.includes(pathname)

  // If no token and trying to access protected route
  if (!refreshToken && !isPublicRoute) {
    console.log('🔄 Middleware: No token, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If has token and trying to access login page
  if (refreshToken && pathname === '/login') {
    console.log('🔄 Middleware: Has token but on login page, redirecting to dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // For dashboard routes, we'll let the server components handle role-based access
  // This avoids the crypto module issue in Edge Runtime
  console.log('✅ Middleware: Token present, allowing access')
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}