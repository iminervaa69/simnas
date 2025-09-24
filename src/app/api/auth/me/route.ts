import { NextApiResponse } from 'next';
import { withAuth } from '@/lib/middlewares/middleware';
import { AuthenticatedNextApiRequest, ApiResponse } from '@/types/api.types';

export default withAuth(async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
  
  res.json({
    success: true,
    data: {
      user: {
        id: req.user!.userId,
        email: req.user!.email,
        role: req.user!.role,
        firstName: req.user!.firstName,
        lastName: req.user!.lastName
      }
    }
  });
});