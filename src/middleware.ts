import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for API routes and static files
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  console.log('🔍 Middleware: Checking path:', pathname)
  
  const refreshToken = request.cookies.get('refreshToken')?.value
  console.log('🔍 Middleware: Has refresh token:', !!refreshToken)
  
  // Debug: log all cookies
  const allCookies = request.cookies.getAll()
  console.log('🍪 Middleware: All cookies:', allCookies.map(c => c.name).join(', '))

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

  console.log('✅ Middleware: Allowing access to:', pathname)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
