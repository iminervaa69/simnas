import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { refreshAccessToken } from '@/lib/services/authService';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'No refresh token provided' },
        { status: 401 }
      );
    }

    const clientInfo = {
      deviceInfo: request.headers.get('user-agent') || 'Unknown Device',
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown'
    };

    const result = await refreshAccessToken(refreshToken, clientInfo);

    // Set new refresh token in cookie
    cookieStore.set('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    return NextResponse.json({
      success: true,
      data: {
        accessToken: result.accessToken
      },
      message: 'Token refreshed successfully'
    });

  } catch (error: any) {
    console.error('Token refresh error:', error);

    // Clear invalid refresh token
    const cookieStore = await cookies();
    cookieStore.delete('refreshToken');

    return NextResponse.json(
      { success: false, error: error.message || 'Token refresh failed' },
      { status: 401 }
    );
  }
}