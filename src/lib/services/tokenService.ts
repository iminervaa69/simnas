import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '@/lib/database/connection';
import { JWTPayload } from '@/types/auth.types';
import { User } from '@/types/user.types';
import ms from 'ms';

const JWT_SECRET = process.env.JWT_SECRET!;
const ACCESS_TOKEN_EXPIRES_IN = 15 * 60 * 1000;

export function generateAccessToken(user: User): string {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    role: user.role,
    firstName: user.first_name,
    lastName: user.last_name
  };
  
  // const expiresIn = ms(ACCESS_TOKEN_EXPIRES_IN);
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN  // Use string directly
  });
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

export async function storeRefreshToken(
  userId: string, 
  refreshToken: string, 
  deviceInfo?: string, 
  ipAddress?: string
): Promise<{ id: string }> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  const result = await query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at, device_info, ip_address) 
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [userId, refreshToken, expiresAt, deviceInfo, ipAddress]
  );
  
  return result.rows[0];
}

export function verifyAccessToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

// Updated function - only needs token, finds user from token
export async function validateRefreshToken(
  token: string
): Promise<{ isValid: boolean; userId?: string; user?: User }> {
  const result = await query(
    `SELECT rt.*, u.* FROM refresh_tokens rt
     JOIN users u ON rt.user_id = u.id
     WHERE rt.token = $1 AND rt.revoked_at IS NULL AND u.deleted_at IS NULL`,
    [token]
  );
  
  if (result.rows.length === 0) {
    return { isValid: false };
  }
  
  const row = result.rows[0];
  
  // Check if the token is expired
  if (new Date() > new Date(row.expires_at)) {
    // Optionally clean up expired token
    await query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = $1',
      [token]
    );
    return { isValid: false };
  }
  
  // Update last used timestamp
  await query(
    'UPDATE refresh_tokens SET last_used = NOW() WHERE token = $1',
    [token]
  );
  
  const user: User = {
    id: row.id,
    email: row.email,
    password_hash: row.password_hash,
    role: row.role,
    first_name: row.first_name,
    last_name: row.last_name,
    phone: row.phone,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at
  };
  
  return { 
    isValid: true, 
    userId: row.user_id, 
    user 
  };
}

// Updated function - only needs token
export async function revokeRefreshToken(token: string): Promise<void> {
  await query(
    `UPDATE refresh_tokens 
     SET revoked_at = NOW() 
     WHERE token = $1 AND revoked_at IS NULL`,
    [token]
  );
}

// New function to revoke all tokens for a user
export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  await query(
    `UPDATE refresh_tokens 
     SET revoked_at = NOW() 
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
}

// New function to revoke a specific token by ID (for session management)
export async function revokeRefreshTokenById(tokenId: string, userId: string): Promise<void> {
  await query(
    `UPDATE refresh_tokens 
     SET revoked_at = NOW() 
     WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL`,
    [tokenId, userId]
  );
}

// New function to clean up expired tokens (can be called periodically)
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await query(
    `UPDATE refresh_tokens 
     SET revoked_at = NOW() 
     WHERE expires_at < NOW() AND revoked_at IS NULL`
  );
  
  return result.rowCount || 0;
}

// New function to get token info (useful for debugging/monitoring)
export async function getRefreshTokenInfo(token: string): Promise<{
  id: string;
  userId: string;
  deviceInfo?: string;
  ipAddress?: string;
  createdAt: Date;
  expiresAt: Date;
  lastUsed?: Date;
  isRevoked: boolean;
  isExpired: boolean;
} | null> {
  const result = await query(
    `SELECT id, user_id, device_info, ip_address, created_at, expires_at, last_used, revoked_at
     FROM refresh_tokens 
     WHERE token = $1`,
    [token]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  const now = new Date();
  
  return {
    id: row.id,
    userId: row.user_id,
    deviceInfo: row.device_info,
    ipAddress: row.ip_address,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    lastUsed: row.last_used,
    isRevoked: !!row.revoked_at,
    isExpired: now > new Date(row.expires_at)
  };
}

// Legacy function for backward compatibility (if needed elsewhere)
export async function validateRefreshTokenForUser(
  token: string, 
  userId: string
): Promise<{ valid: boolean; user?: User }> {
  const result = await validateRefreshToken(token);
  
  if (!result.isValid || result.userId !== userId) {
    return { valid: false };
  }
  
  return { valid: true, user: result.user };
}

// Legacy function for backward compatibility (if needed elsewhere)
export async function revokeRefreshTokenForUser(
  token: string, 
  userId: string
): Promise<void> {
  await query(
    `UPDATE refresh_tokens 
     SET revoked_at = NOW() 
     WHERE token = $1 AND user_id = $2 AND revoked_at IS NULL`,
    [token, userId]
  );
}