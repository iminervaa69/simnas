import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loginUser } from '@/lib/services/authService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    console.log('🔄 API: Login attempt for:', email);
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    const clientInfo = {
      deviceInfo: request.headers.get('user-agent') || 'Unknown Device',
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown'
    };
    
    const result = await loginUser(email.toLowerCase().trim(), password, clientInfo);
    console.log('✅ API: Login successful for:', result.user.email, result.user.role);
    
    // Create response first
    const response = NextResponse.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken
      },
      message: result.message
    });
    
    // Set cookie on the response directly
    response.cookies.set('refreshToken', result.refreshToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    });
    
    console.log('🍪 API: Refresh token cookie set');
    
    return response;
    
  } catch (error: any) {
    console.error('❌ API: Login error:', error);
    
    if (error.message.includes('Invalid email or password')) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}