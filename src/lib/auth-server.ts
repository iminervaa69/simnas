import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { validateRefreshToken } from '@/lib/services/tokenService';
import { getUserProfile } from '@/lib/services/authService';
import { UserResponse } from '@/types/user.types';

export async function getCurrentUser(): Promise<UserResponse | null> {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    console.log('🔍 Server: Checking auth, refreshToken exists:', !!refreshToken);

    if (!refreshToken) {
      console.log('❌ Server: No refresh token found');
      return null;
    }

    const tokenData = await validateRefreshToken(refreshToken);
    
    if (!tokenData.isValid || !tokenData.userId) {
      console.log('❌ Server: Invalid refresh token');
      return null;
    }

    console.log('✅ Server: Valid token for user:', tokenData.userId);
    const user = await getUserProfile(tokenData.userId);
    console.log('✅ Server: User profile loaded:', user.email, user.role);
    return user;
  } catch (error) {
    console.error('❌ Server: Get current user error:', error);
    return null;
  }
}

export async function requireAuth(): Promise<UserResponse> {
  const user = await getCurrentUser();
  
  if (!user) {
    console.log('🔄 Server: No user found, redirecting to login');
    redirect('/login');
  }
  
  console.log('✅ Server: User authenticated:', user.email);
  return user;
}

export async function requireRole(allowedRoles: string[]): Promise<UserResponse> {
  const user = await requireAuth();
  
  if (!allowedRoles.includes(user.role)) {
    redirect('/unauthorized');
  }
  
  return user;
}

// Utility to check auth without redirecting
export async function checkAuth(): Promise<{ isAuthenticated: boolean; user: UserResponse | null }> {
  const user = await getCurrentUser();
  return {
    isAuthenticated: !!user,
    user
  };
}

// Role-specific auth helpers
export const requireAdmin = () => requireRole(['admin']);
export const requireGuru = () => requireRole(['admin', 'guru']);
export const requireSiswa = () => requireRole(['admin', 'siswa']);