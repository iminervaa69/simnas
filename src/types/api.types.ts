import { NextApiRequest } from 'next';
import { JWTPayload } from './auth.types';

export interface AuthenticatedNextApiRequest extends NextApiRequest {
  user?: JWTPayload;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}