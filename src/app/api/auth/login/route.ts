import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loginUser } from '@/lib/services/authService';
import { getClientInfo } from '@/utils/clientInfo';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
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
    
    const cookieStore = await cookies();
    cookieStore.set('refreshToken', result.refreshToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    });
    
    return NextResponse.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken
      },
      message: result.message
    });
    
  } catch (error: any) {
    console.error('Login error:', error);
    
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