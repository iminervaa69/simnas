import { UserResponse } from './user.types';

export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken?: string; // Add this line
  message?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'customer' | 'employee' | 'admin';
  firstName?: string;
  lastName?: string;
  iat?: number;
  exp?: number;
}

export interface ClientInfo {
  deviceInfo?: string;
  ipAddress?: string;
}