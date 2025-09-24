import bcrypt from 'bcrypt';

/**
 * Configuration for password hashing
 */
const SALT_ROUNDS = 12; // Higher number = more secure but slower

/**
 * Hashes a plain text password using bcrypt
 * @param password - The plain text password to hash
 * @returns Promise that resolves to the hashed password
 * @throws Error if password is invalid or hashing fails
 */
export async function hashPassword(password: string): Promise<string> {
  // Validate password input
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
  
  if (password.length > 128) {
    throw new Error('Password must be less than 128 characters long');
  }
  
  try {
    // Generate salt and hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    throw new Error('Failed to hash password');
  }
}

/**
 * Compares a plain text password with a hashed password
 * @param password - The plain text password to verify
 * @param hashedPassword - The hashed password to compare against
 * @returns Promise that resolves to true if passwords match, false otherwise
 * @throws Error if inputs are invalid or comparison fails
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  // Validate inputs
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  
  if (!hashedPassword || typeof hashedPassword !== 'string') {
    throw new Error('Hashed password must be a non-empty string');
  }
  
  try {
    // Compare password with hash
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    throw new Error('Failed to compare password');
  }
}

/**
 * Validates password strength (optional utility function)
 * @param password - The password to validate
 * @returns Object with validation results
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} {
  const errors: string[] = [];
  
  if (!password || typeof password !== 'string') {
    errors.push('Password must be a string');
    return { isValid: false, errors, strength: 'weak' };
  }
  
  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters long');
  }
  
  // Character type checks
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }
  
  // Common password patterns
  const commonPatterns = ['123456', 'password', 'qwerty', 'abc123'];
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    errors.push('Password contains common patterns');
  }
  
  // Determine strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  const criteraMet = [hasLowerCase, hasUpperCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
  
  if (password.length >= 8 && criteraMet >= 4) {
    strength = 'strong';
  } else if (password.length >= 6 && criteraMet >= 2) {
    strength = 'medium';
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
}

/**
 * Generates a random secure password (utility function)
 * @param length - Desired password length (default: 16)
 * @param options - Character set options
 * @returns Generated password string
 */
export function generateSecurePassword(
  length: number = 16,
  options: {
    includeLowercase?: boolean;
    includeUppercase?: boolean;
    includeNumbers?: boolean;
    includeSpecialChars?: boolean;
  } = {
    includeLowercase: true,
    includeUppercase: true,
    includeNumbers: true,
    includeSpecialChars: true
  }
): string {
  let charset = '';
  
  if (options.includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (options.includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (options.includeNumbers) charset += '0123456789';
  if (options.includeSpecialChars) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  if (charset === '') {
    throw new Error('At least one character type must be enabled');
  }
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
}