import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logoutUser } from '@/lib/services/authService';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;
    
    if (refreshToken) {
      await logoutUser(refreshToken);
    }
    
    // Clear refresh token cookie
    cookieStore.delete('refreshToken');
    
    // Clear tab-related cookies
    cookieStore.delete('globalTabs');
    
    // Clear all form draft cookies (they start with 'formDraft_')
    // Note: We can't enumerate all cookies, but we can set a flag to clear them on the client side
    cookieStore.set('clearTabCookies', 'true', { 
      path: '/', 
      maxAge: 1 // Expires in 1 second
    });
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    
    // Still clear the cookie even if logout fails
    const cookieStore = await cookies();
    cookieStore.delete('refreshToken');
    
    // Clear tab-related cookies
    cookieStore.delete('globalTabs');
    
    // Clear all form draft cookies (they start with 'formDraft_')
    // Note: We can't enumerate all cookies, but we can set a flag to clear them on the client side
    cookieStore.set('clearTabCookies', 'true', { 
      path: '/', 
      maxAge: 1 // Expires in 1 second
    });
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
}