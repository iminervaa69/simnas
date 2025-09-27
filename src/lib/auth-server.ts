import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { validateRefreshToken } from '@/lib/services/tokenService';
import { getUserProfile } from '@/lib/services/authService';
import { UserResponse } from '@/types/user.types';

export async function getCurrentUser(): Promise<UserResponse | null> {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      return null;
    }

    const tokenData = await validateRefreshToken(refreshToken);
    
    if (!tokenData.isValid || !tokenData.userId) {
      return null;
    }

    const user = await getUserProfile(tokenData.userId);
    return user;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

export async function requireAuth(): Promise<UserResponse> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
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