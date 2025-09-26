import axios from 'axios';
import { AxiosRequestConfig, AxiosRequestHeaders } from 'axios';
import { UserResponse } from '@/types/user.types';
import { AuthResponse } from '@/types/auth.types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface AuthApiResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken?: string;
}

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

interface RequestConfigWithHeaders extends AxiosRequestConfig {
  headers: AxiosRequestHeaders;
}

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

if (typeof window !== 'undefined') {
  const token = localStorage.getItem('accessToken');
  if (token) {
    setAccessToken(token);
  }
}

api.interceptors.request.use((config: RequestConfigWithHeaders) => {
  if (!config.headers) {
    config.headers = {} as AxiosRequestHeaders;
  }
  
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return config;
});

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
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.post<ApiResponse<AuthApiResponse>>('/auth/login', { 
        email, 
        password 
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Login failed');
      }
      
      const { user, accessToken, refreshToken } = response.data.data;
      setAccessToken(accessToken);
      
      return { 
        user, 
        accessToken, 
        refreshToken,
        message: response.data.message 
      };
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || 'Login failed');
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },

  getCurrentUser: async (): Promise<UserResponse> => {
    const response = await api.get<ApiResponse<{ user: UserResponse }>>('/auth/me');
    return response.data.data.user;
  },
};