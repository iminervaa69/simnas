import { query } from '../database/connection';
import { User, UserResponse, RegisterUserData } from '@/types/user.types';
import { AuthResponse, TokenPair, ClientInfo } from '@/types/auth.types';
import { hashPassword, comparePassword } from '@/utils/password';
import { generateAccessToken, generateRefreshToken, storeRefreshToken, validateRefreshToken, revokeRefreshToken } from './tokenService';

export async function registerUser(userData: RegisterUserData, clientInfo?: ClientInfo): Promise<AuthResponse> {
  const { email, password, role = 'customer', firstName, lastName, phone } = userData;
  
  // Check if user already exists
  const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
  
  if (existingUser.rows.length > 0) {
    throw new Error('User already exists with this email');
  }
  
  // Hash password
  const passwordHash = await hashPassword(password);
  
  // Insert user
  const result = await query(
    `INSERT INTO users (email, password_hash, role, first_name, last_name, phone) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING id, email, role, first_name, last_name, phone, created_at`,
    [email, passwordHash, role, firstName, lastName, phone]
  );
  
  const user: User = result.rows[0];
  
  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  
  // Store refresh token
  await storeRefreshToken(user.id, refreshToken, clientInfo?.deviceInfo, clientInfo?.ipAddress);
  
  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      createdAt: user.created_at
    },
    accessToken,
    message: 'User registered successfully'
  };
}

export async function loginUser(
  email: string, 
  password: string, 
  clientInfo?: ClientInfo
): Promise<AuthResponse> {
  // Get user by email
  const result = await query(
    'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
    [email]
  );
  
  if (result.rows.length === 0) {
    throw new Error('Invalid email or password');
  }
  
  const user: User = result.rows[0];
  
  // Compare password
  const isValidPassword = await comparePassword(password, user.password_hash);
  
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }
  
  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  
  // Store refresh token
  await storeRefreshToken(user.id, refreshToken, clientInfo?.deviceInfo, clientInfo?.ipAddress);
  
  // Update last login
  await query('UPDATE users SET updated_at = NOW() WHERE id = $1', [user.id]);
  
  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      createdAt: user.created_at
    },
    accessToken,
    message: 'Login successful'
  };
}

export async function refreshAccessToken(refreshToken: string, clientInfo?: ClientInfo): Promise<TokenPair> {
  // Validate refresh token
  const tokenData = await validateRefreshToken(refreshToken);
  
  if (!tokenData || !tokenData.isValid) {
    throw new Error('Invalid or expired refresh token');
  }
  
  // Get user data
  const userResult = await query(
    'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
    [tokenData.userId]
  );
  
  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }
  
  const user: User = userResult.rows[0];
  
  // Generate new tokens
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken();
  
  // Revoke old refresh token
  await revokeRefreshToken(refreshToken);
  
  // Store new refresh token
  await storeRefreshToken(user.id, newRefreshToken, clientInfo?.deviceInfo, clientInfo?.ipAddress);
  
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };
}

export async function logoutUser(refreshToken: string): Promise<{ message: string }> {
  try {
    // Revoke refresh token
    await revokeRefreshToken(refreshToken);
    
    return {
      message: 'Logout successful'
    };
  } catch (error) {
    // Even if token revocation fails, consider logout successful
    return {
      message: 'Logout successful'
    };
  }
}

export async function logoutAllDevices(userId: string): Promise<{ message: string }> {
  // Revoke all refresh tokens for the user
  await query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
    [userId]
  );
  
  return {
    message: 'Logged out from all devices successfully'
  };
}

export async function changePassword(
  userId: string, 
  currentPassword: string, 
  newPassword: string
): Promise<{ message: string }> {
  // Get user data
  const userResult = await query(
    'SELECT password_hash FROM users WHERE id = $1 AND deleted_at IS NULL',
    [userId]
  );
  
  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }
  
  const user = userResult.rows[0];
  
  // Verify current password
  const isValidPassword = await comparePassword(currentPassword, user.password_hash);
  
  if (!isValidPassword) {
    throw new Error('Current password is incorrect');
  }
  
  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);
  
  // Update password
  await query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [newPasswordHash, userId]
  );
  
  // Optionally revoke all refresh tokens to force re-login on all devices
  await query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
    [userId]
  );
  
  return {
    message: 'Password changed successfully'
  };
}

export async function getUserProfile(userId: string): Promise<UserResponse> {
  const result = await query(
    'SELECT id, email, role, first_name, last_name, phone, created_at FROM users WHERE id = $1 AND deleted_at IS NULL',
    [userId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  
  const user = result.rows[0];
  
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone,
    createdAt: user.created_at
  };
}

export async function updateUserProfile(
  userId: string, 
  updateData: Partial<Pick<RegisterUserData, 'firstName' | 'lastName' | 'phone'>>
): Promise<UserResponse> {
  const { firstName, lastName, phone } = updateData;
  
  // Build dynamic query
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;
  
  if (firstName !== undefined) {
    updates.push(`first_name = $${paramCount}`);
    values.push(firstName);
    paramCount++;
  }
  
  if (lastName !== undefined) {
    updates.push(`last_name = $${paramCount}`);
    values.push(lastName);
    paramCount++;
  }
  
  if (phone !== undefined) {
    updates.push(`phone = $${paramCount}`);
    values.push(phone);
    paramCount++;
  }
  
  if (updates.length === 0) {
    throw new Error('No fields to update');
  }
  
  updates.push(`updated_at = NOW()`);
  values.push(userId);
  
  const result = await query(
    `UPDATE users SET ${updates.join(', ')} 
     WHERE id = $${paramCount} AND deleted_at IS NULL 
     RETURNING id, email, role, first_name, last_name, phone, created_at`,
    values
  );
  
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  
  const user = result.rows[0];
  
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone,
    createdAt: user.created_at
  };
}

export async function getActiveSessionsForUser(userId: string): Promise<Array<{
  id: string;
  deviceInfo?: string;
  ipAddress?: string;
  createdAt: Date;
  lastUsed: Date;
}>> {
  const result = await query(
    `SELECT id, device_info, ip_address, created_at, last_used 
     FROM refresh_tokens 
     WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW() 
     ORDER BY last_used DESC`,
    [userId]
  );
  
  return result.rows.map((row: any) => ({
    id: row.id,
    deviceInfo: row.device_info,
    ipAddress: row.ip_address,
    createdAt: row.created_at,
    lastUsed: row.last_used
  }));
}

export async function revokeSession(userId: string, sessionId: string): Promise<{ message: string }> {
  const result = await query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL',
    [sessionId, userId]
  );
  
  if (result.rowCount === 0) {
    throw new Error('Session not found');
  }
  
  return {
    message: 'Session revoked successfully'
  };
}