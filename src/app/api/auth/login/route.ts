import { NextApiRequest, NextApiResponse } from 'next';
import { setCookie } from 'cookies-next';
import { loginUser } from '@/lib/services/authService';
import { getClientInfo } from '@/utils/clientInfo';
import { ApiResponse } from '@/types/api.types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    const clientInfo = getClientInfo(req);
    const result = await loginUser(email.toLowerCase().trim(), password, clientInfo);
    
    // Set refresh token as httpOnly cookie
    setCookie('refreshToken', result.refreshToken, {
      req,
      res,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    });
    
    res.json({
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
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
}