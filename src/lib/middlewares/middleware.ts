import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccessToken } from '@/lib/services/tokenService';
import { AuthenticatedNextApiRequest, ApiResponse } from '@/types/api.types';

export function withAuth(
  handler: (req: AuthenticatedNextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse<ApiResponse>) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Access token required'
        });
      }
      
      const user = verifyAccessToken(token);
      (req as AuthenticatedNextApiRequest).user = user;
      
      await handler(req as AuthenticatedNextApiRequest, res);
    } catch (error: any) {
      return res.status(403).json({
        success: false,
        error: error.message || 'Authentication failed'
      });
    }
  };
}

export function withRole(roles: string | string[]) {
  return function(
    handler: (req: AuthenticatedNextApiRequest, res: NextApiResponse) => Promise<void>
  ) {
    return withAuth(async (req: AuthenticatedNextApiRequest, res: NextApiResponse<ApiResponse>) => {
      const userRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!req.user || !userRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
      }
      
      await handler(req, res);
    });
  };
}