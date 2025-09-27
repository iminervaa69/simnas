import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { UserResponse } from '@/types/user.types';
import { AuthResponse } from '@/types/auth.types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface AuthApiResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken?: string;
}

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 10000,
});

let accessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Token management
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
  const savedToken = localStorage.getItem('accessToken');
  if (savedToken) {
    setAccessToken(savedToken);
  }
}

// Helper to handle refresh subscribers
const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRrefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

// Request interceptor
api.interceptors.request.use((config) => {
  if (accessToken && config.headers) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor with proper refresh logic
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;
    
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const { accessToken: newToken } = data.data;
          
          setAccessToken(newToken);
          isRefreshing = false;
          onRrefreshed(newToken);

          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          }
          return api(originalRequest);
        } else {
          throw new Error('Refresh failed');
        }
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];
        setAccessToken(null);
        
        // Only redirect if not already on login page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
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
        password,
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Login failed');
      }

      const { user, accessToken: token } = response.data.data;
      setAccessToken(token);

      return {
        user,
        accessToken: token,
        message: response.data.message,
      };
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || 'Login failed');
    }
  },

  register: async (userData: {
    email: string;
    password: string;
    role?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<AuthResponse> => {
    try {
      const response = await api.post<ApiResponse<AuthApiResponse>>('/auth/register', userData);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Registration failed');
      }

      const { user, accessToken: token } = response.data.data;
      setAccessToken(token);

      return {
        user,
        accessToken: token,
        message: response.data.message,
      };
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || 'Registration failed');
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAccessToken(null);
    }
  },

  getCurrentUser: async (): Promise<UserResponse> => {
    const response = await api.get<ApiResponse<{ user: UserResponse }>>('/auth/me');
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to get user');
    }
    return response.data.data.user;
  },

  refreshToken: async (): Promise<{ accessToken: string }> => {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    return data.data;
  },
};