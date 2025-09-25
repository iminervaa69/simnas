import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { registerUser } from '@/lib/services/authService';
import { validateRegistrationData } from '@/utils/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Register request body:', body);
    
    const { email, password, role, firstName, lastName, phone } = body;
    
    const validation = validateRegistrationData({
      email,
      password,
      firstName,
      lastName,
      phone,
      role
    });
    
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: validation.errors 
        },
        { status: 400 }
      );
    }
    
    const clientInfo = {
      deviceInfo: request.headers.get('user-agent') || 'Unknown Device',
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown' 
    };
    
    console.log('Client info:', clientInfo);
    
    const result = await registerUser({
      email: email.toLowerCase().trim(),
      password,
      role: role || 'siswa',
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      phone: phone?.trim()
    }, clientInfo);
    
    if (result.refreshToken) {
      const cookieStore = await cookies();
      cookieStore.set('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, 
        path: '/'
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken
      },
      message: result.message
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.message.includes('already exists')) {
      return NextResponse.json(
        { success: false, error: 'User already exists with this email' },
        { status: 409 }
      );
    }
    
    if (error.message.includes('validation') || error.message.includes('required')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}