import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAccessToken } from '@/lib/services/tokenService'
import { hasRouteAccess } from '@/config/permissions'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') ||
    pathname === '/login'
  ) {
    return NextResponse.next()
  }

  const refreshToken = request.cookies.get('refreshToken')?.value

  if (!refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const payload = verifyAccessToken(refreshToken)
    const userRole = payload.role

    if (!hasRouteAccess(pathname, userRole)) {

      const fallbackRoutes = {
        admin: '/dashboard',
        guru: '/dashboard', 
        siswa: '/dashboard'
      }

      return NextResponse.redirect(
        new URL(fallbackRoutes[userRole] || '/dashboard', request.url)
      )
    }
    
    return NextResponse.next()
    
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}