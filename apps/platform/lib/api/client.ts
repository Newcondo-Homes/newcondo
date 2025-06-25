/* eslint-disable @typescript-eslint/no-explicit-any */

// apps/platform/lib/api/client.ts
import { getSession } from '@newcondo/auth/client';
import type { User } from '@/types/api'

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  user?: User;
  token?: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const session = await getSession();
    const headers = { ...this.defaultHeaders };
    
    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
    }
    
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    
    let data: any;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const error: ApiError = {
        message: data.message || data.error || 'An error occurred',
        status: response.status,
        code: data.code
      };
      throw error;
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getAuthHeaders();

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error && 'status' in error) {
        throw error; // Re-throw ApiError
      }
      
      // Handle network errors or other fetch errors
      throw {
        message: error instanceof Error ? error.message : 'Network error occurred',
        status: 0,
      } as ApiError;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return this.request<T>(url, {
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // File upload method
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const headers = await this.getAuthHeaders();
    delete headers['Content-Type']; // Let browser set content-type for FormData

    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: formData,
    });
  }

  // Multiple file upload method
  async uploadFiles<T>(
    endpoint: string,
    files: File[],
    additionalData?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const headers = await this.getAuthHeaders();
    delete headers['Content-Type']; // Let browser set content-type for FormData

    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: formData,
    });
  }

  // Utility method to check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const session = await getSession();
    return !!session?.accessToken;
  }

  // Method to get current user session
  async getCurrentSession() {
    return await getSession();
  }

  // Method to handle retry logic for failed requests
  async retryRequest<T>(
    requestFn: () => Promise<ApiResponse<T>>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<ApiResponse<T>> {
    let lastError: ApiError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as ApiError;
        
        // Don't retry on client errors (4xx)
        if (lastError.status >= 400 && lastError.status < 500) {
          throw lastError;
        }
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    
    throw lastError!;
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Export utility functions for common API patterns
export const createApiError = (message: string, status: number, code?: string): ApiError => ({
  message,
  status,
  code,
});

export const isApiError = (error: unknown): error is ApiError => {

      return (
        error instanceof Error && 
        typeof error.message === 'string' 
        // Add more checks for other properties if needed
    );
  // return errorr && typeof errorr.message === 'string' && typeof error.status === 'number';

};

// Export types
export type { ApiClient };
export default apiClient;