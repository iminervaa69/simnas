import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/services/tokenService';
import { getUserProfile } from '@/lib/services/authService';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Access token required' },
        { status: 401 }
      );
    }

    const payload = verifyAccessToken(token);
    const user = await getUserProfile(payload.userId);

    return NextResponse.json({
      success: true,
      data: { user },
      message: 'User data retrieved successfully'
    });

  } catch (error: any) {
    console.error('Get user error:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to get user data' },
      { status: 500 }
    );
  }
}