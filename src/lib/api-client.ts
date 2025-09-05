
import { AUTH_CODE, ENABLE_AUTH, DEFAULT_DEV_USER_ID } from '@/constants/auth';
import { ApiError, safeFetch } from '@/lib/api-error';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errorMessage?: string;
  errorCode?: string;
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshToken(): Promise<boolean> {
  try {
    const response = await safeFetch<ApiResponse>('/next_api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.success || false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
}

function redirectToLogin() {
  if (typeof window !== 'undefined' && ENABLE_AUTH) {
    const currentPath = window.location.pathname;
    if(currentPath === '/login') {
      return;
    }
    const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;
    window.location.href = loginUrl;
  }
}

async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit,
  isRetry = false
): Promise<T> {
  try {
    const response = await safeFetch<ApiResponse<T>>(`/next_api${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    // Handle authentication errors only if auth is enabled
    if (ENABLE_AUTH) {
      if ([AUTH_CODE.TOKEN_MISSING].includes(response.errorCode || '')) {
        redirectToLogin();
        throw new ApiError('Authentication required', { status: 401, url: endpoint, data: response });
      }

      if (response.errorCode === AUTH_CODE.TOKEN_EXPIRED && !isRetry) {
        
        if (isRefreshing && refreshPromise) {
          const refreshSuccess = await refreshPromise;
          if (refreshSuccess) {
            return apiRequest<T>(endpoint, options, true);
          } else {
            redirectToLogin();
            throw new ApiError('Token refresh failed, redirecting to login', { status: 401, url: endpoint, data: response });
          }
        }

        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = refreshToken();
          
          try {
            const refreshSuccess = await refreshPromise;
            
            if (refreshSuccess) {
              return apiRequest<T>(endpoint, options, true);
            } else {
              redirectToLogin();
              throw new ApiError('Token refresh failed, redirecting to login', { status: 401, url: endpoint, data: response });
            }
          } finally {
            isRefreshing = false;
            refreshPromise = null;
          }
        }
      }
    }

    // Handle API-level errors
    if (!response.success) {
      throw new ApiError(
        response.errorMessage || 'API request failed', 
        { status: 400, url: endpoint, data: response }
      );
    }

    return response.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('Network error: Unable to connect to server', { status: 0, url: endpoint });
    }
    
    console.error('API request error:', error);
    throw new ApiError('An unexpected error occurred', { status: 500, url: endpoint });
  }
}

export const api = {
  get: <T = any>(endpoint: string, params?: Record<string, string>) => {
    const url = params 
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    return apiRequest<T>(url, { method: 'GET' });
  },

  post: <T = any>(endpoint: string, data?: any) => {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    const headers: Record<string, string> = {};
    
    if (!(data instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? body : undefined,
      headers,
    });
  },

  put: <T = any>(endpoint: string, data?: any) => {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    const headers: Record<string, string> = {};
    
    if (!(data instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    return apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? body : undefined,
      headers,
    });
  },

  delete: <T = any>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};

export { ApiError };
export type { ApiResponse };
