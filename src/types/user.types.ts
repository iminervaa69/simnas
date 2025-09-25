export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: 'siswa' | 'guru' | 'admin';
  first_name?: string;
  last_name?: string;
  phone?: string;
  is_verified?: boolean; 
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface UserResponse {
  id: string;
  email: string;
  role: 'siswa' | 'guru' | 'admin'; 
  firstName?: string;
  lastName?: string;
  phone?: string;
  isVerified?: boolean;
  createdAt: Date;
}

export interface RegisterUserData {
  email: string;
  password: string;
  role?: 'siswa' | 'guru' | 'admin';
  firstName?: string;
  lastName?: string;
  phone?: string;
}