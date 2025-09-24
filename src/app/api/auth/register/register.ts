import { NextApiRequest, NextApiResponse } from 'next';
import { setCookie } from 'cookies-next';
import { registerUser } from '@/lib/services/authService';
import { getClientInfo } from '@/utils/clientInfo';
import { ApiResponse } from '@/types/api.types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {

  console.log('Method:', req.method);
  console.log('Body:', req.body);
  console.log('Content-Type:', req.headers['content-type']);
  

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
  
  try {
    const { email, password, role, firstName, lastName, phone } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    const clientInfo = getClientInfo(req);
    
    const result = await registerUser({
      email: email.toLowerCase().trim(),
      password,
      role: role || 'customer',
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      phone: phone?.trim()
    }, clientInfo);
    
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
    
    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken
      },
      message: result.message
    });
    
  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: 'User already exists with this email'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
}