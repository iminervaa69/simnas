export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  // Basic phone validation - adjust regex based on your requirements
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

export function validateName(name: string): boolean {
  return name.trim().length >= 2 && /^[a-zA-Z\s\-']+$/.test(name);
}

export function validateRegistrationData(data: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  // Email validation
  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Please provide a valid email address';
  }

  // Password validation
  if (!data.password) {
    errors.password = 'Password is required';
  } else {
    const passwordValidation = validatePasswordStrength(data.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0]; // Show first error
    }
  }

  // Name validation
  if (data.firstName && !validateName(data.firstName)) {
    errors.firstName = 'First name must be at least 2 characters and contain only letters';
  }

  if (data.lastName && !validateName(data.lastName)) {
    errors.lastName = 'Last name must be at least 2 characters and contain only letters';
  }

  // Phone validation
  if (data.phone && !validatePhone(data.phone)) {
    errors.phone = 'Please provide a valid phone number';
  }

  // Role validation
  if (data.role && !['customer', 'employee', 'admin'].includes(data.role)) {
    errors.role = 'Invalid role specified';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateLoginData(data: {
  email: string;
  password: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Please provide a valid email address';
  }

  if (!data.password) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Import from password.ts
function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }
    return {
        isValid: errors.length === 0,
        errors
    };
}