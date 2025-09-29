// src/lib/auth-server.ts
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { validateRefreshToken } from '@/lib/services/tokenService'
import { UserResponse } from '@/types/user.types'
import { hasRouteAccess, UserRole } from '@/config/permissions'

export async function getCurrentUser(): Promise<UserResponse | null> {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refreshToken')?.value
    
    if (!refreshToken) {
      return null
    }

    // Validate refresh token and get user data
    const validation = await validateRefreshToken(refreshToken)
    
    if (!validation.isValid || !validation.user) {
      return null
    }

    const user = validation.user
    
    // Convert to UserResponse format
    const userResponse: UserResponse = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name || undefined,
      lastName: user.last_name || undefined,
      phone: user.phone || undefined,
      isVerified: user.is_verified || false,
      createdAt: user.created_at
    }
    
    return userResponse
    
  } catch (error) {
    console.error('❌ Server: Auth check failed:', error)
    return null
  }
}

export async function requireAuth(): Promise<UserResponse> {
  const user = await getCurrentUser()
  
  if (!user) {
    console.log('❌ Server: No authenticated user, redirecting to login')
    redirect('/login')
  }
  
  return user
}

// Enhanced function that also checks route permissions
export async function requireAuthWithPermissions(
  requiredPath?: string
): Promise<UserResponse> {
  const user = await requireAuth()
  
  if (requiredPath) {
    const hasAccess = hasRouteAccess(requiredPath, user.role as UserRole)
    
    if (!hasAccess) {
      console.log(`❌ Server: User ${user.role} denied access to ${requiredPath}`)
      
      // Redirect to appropriate dashboard based on role
      const fallbackRoutes = {
        admin: '/dashboard',
        guru: '/dashboard', 
        siswa: '/dashboard'
      }
      
      redirect(fallbackRoutes[user.role as UserRole] || '/dashboard')
    }
  }
  
  return user
}