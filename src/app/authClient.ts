import axios from 'axios';
import { UserResponse, RegisterUserData } from '@/types/user.types';
import { AuthResponse } from '@/types/auth.types';

// API response wrapper types
interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface AuthApiResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string; // Add refreshToken if your API provides it
}

interface UserApiResponse {
  user: UserResponse;
}

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Token management
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('accessToken', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('accessToken');
  }
};

// Initialize token from localStorage
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('accessToken');
  if (token) {
    setAccessToken(token);
  }
}

// Request interceptor
api.interceptors.request.use((config) => {
  // Ensure headers object exists
  if (!config.headers) {
    config.headers = {};
  }
  
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      
      try {
        const response = await api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
        const { accessToken: newToken } = response.data.data;
        setAccessToken(newToken);
        return api(original);
      } catch (refreshError) {
        setAccessToken(null);
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const authApi = {
  register: async (userData: RegisterUserData): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthApiResponse>>('/auth/register', userData);
    const { user, accessToken, refreshToken } = response.data.data;
    setAccessToken(accessToken);

    return { user, accessToken, refreshToken: refreshToken || undefined };
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthApiResponse>>('/auth/login', { email, password });
    const { user, accessToken, refreshToken } = response.data.data;
    setAccessToken(accessToken);
    return { user, accessToken, refreshToken: refreshToken || undefined };
  },

  logout: async (): Promise<void> => {
    await api.post<void>('/auth/logout');
    setAccessToken(null);
  },

  getCurrentUser: async (): Promise<UserResponse> => {
    const response = await api.get<ApiResponse<UserApiResponse>>('/auth/me');
    return response.data.data.user;
  },

  refreshToken: async (): Promise<string> => {
    const response = await api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
    const { accessToken } = response.data.data;
    setAccessToken(accessToken);
    return accessToken;
  },
};