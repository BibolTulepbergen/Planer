// API client with automatic JWT token injection
import { Capacitor } from '@capacitor/core';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

// Use full domain for native mobile apps, relative path for web
const getApiBaseUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  
  // If VITE_API_BASE_URL is explicitly set, use it
  if (baseUrl) {
    return `${baseUrl}/api`;
  }
  
  // For native mobile apps, use the full domain
  if (Capacitor.isNativePlatform()) {
    return 'https://planer.moldahasank.workers.dev/api';
  }
  
  // For web builds, use relative path
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Make an authenticated API request
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, headers = {}, ...fetchOptions } = options;

  // Get JWT token from localStorage
  const token = localStorage.getItem('authToken');

  // Prepare headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  // Add Authorization header if token exists and auth is required
  if (requiresAuth && token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Make the request
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers: requestHeaders,
  });

  // Handle 401 Unauthorized - token expired or invalid
  if (response.status === 401) {
    localStorage.removeItem('authToken');
    window.location.reload();
    throw new Error('Authentication required. Please log in again.');
  }

  // Handle other errors
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Helper functions for common HTTP methods
 */
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  patch: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

