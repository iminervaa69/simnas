export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: 'customer' | 'employee' | 'admin';
  first_name?: string;
  last_name?: string;
  phone?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface UserResponse {
  id: string;
  email: string;
  role: 'customer' | 'employee' | 'admin';
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt: Date;
}

export interface RegisterUserData {
  email: string;
  password: string;
  role?: 'customer' | 'employee' | 'admin';
  firstName?: string;
  lastName?: string;
  phone?: string;
}