import axios, { AxiosError, AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:4003';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;









// // apps/admin/src/lib/api/client.ts

// import axios, { AxiosInstance, AxiosError, InternalAxeOptions } from 'axios';

// const API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:5000/api/admin';

// /**
//  * Standard API response format
//  */
// export interface ApiResponse<T = any> {
//   success: boolean;
//   data?: T;
//   error?: string;
//   message?: string;
// }

// /**
//  * Create axios instance with default configuration
//  */
// const createApiClient = (): AxiosInstance => {
//   const client = axios.create({
//     baseURL: API_BASE_URL,
//     timeout: 30000,
//     headers: {
//       'Content-Type': 'application/json'
//     }
//   });

//   // Request interceptor - Add auth token
//   client.interceptors.request.use(
//     (config) => {
//       // Get token from localStorage
//       if (typeof window !== 'undefined') {
//         const token = localStorage.getItem('adminToken');
//         if (token) {
//           config.headers.Authorization = `Bearer ${token}`;
//         }
//       }
//       return config;
//     },
//     (error) => {
//       return Promise.reject(error);
//     }
//   );

//   // Response interceptor - Handle errors globally
//   client.interceptors.response.use(
//     (response) => {
//       return response;
//     },
//     (error: AxiosError<ApiResponse>) => {
//       // Handle different error scenarios
//       if (error.response) {
//         const { status, data } = error.response;

//         // Unauthorized - clear token and redirect to login
//         if (status === 401) {
//           if (typeof window !== 'undefined') {
//             localStorage.removeItem('adminToken');
//             window.location.href = '/login';
//           }
//         }

//         // Forbidden - insufficient permissions
//         if (status === 403) {
//           console.error('Insufficient permissions:', data.error);
//         }

//         // Return error response
//         return Promise.reject({
//           success: false,
//           error: data.error || data.message || 'An error occurred',
//           status
//         });
//       }

//       // Network error
//       if (error.request) {
//         return Promise.reject({
//           success: false,
//           error: 'Network error. Please check your connection.',
//           status: 0
//         });
//       }

//       // Other errors
//       return Promise.reject({
//         success: false,
//         error: error.message || 'An unexpected error occurred',
//         status: 0
//       });
//     }
//   );

//   return client;
// };

// // Create singleton instance
// export const apiClient = createApiClient();

// /**
//  * Generic GET request
//  */
// export const get = async <T = any>(
//   url: string,
//   config?: InternalAxiosRequestConfig
// ): Promise<ApiResponse<T>> => {
//   try {
//     const response = await apiClient.get<ApiResponse<T>>(url, config);
//     return response.data;
//   } catch (error) {
//     return error as ApiResponse<T>;
//   }
// };

// /**
//  * Generic POST request
//  */
// export const post = async <T = any>(
//   url: string,
//   data?: any,
//   config?: InternalAxiosRequestConfig
// ): Promise<ApiResponse<T>> => {
//   try {
//     const response = await apiClient.post<ApiResponse<T>>(url, data, config);
//     return response.data;
//   } catch (error) {
//     return error as ApiResponse<T>;
//   }
// };

// /**
//  * Generic PUT request
//  */
// export const put = async <T = any>(
//   url: string,
//   data?: any,
//   config?: InternalAxiosRequestConfig
// ): Promise<ApiResponse<T>> => {
//   try {
//     const response = await apiClient.put<ApiResponse<T>>(url, data, config);
//     return response.data;
//   } catch (error) {
//     return error as ApiResponse<T>;
//   }
// };

// /**
//  * Generic PATCH request
//  */
// export const patch = async <T = any>(
//   url: string,
//   data?: any,
//   config?: InternalAxiosRequestConfig
// ): Promise<ApiResponse<T>> => {
//   try {
//     const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
//     return response.data;
//   } catch (error) {
//     return error as ApiResponse<T>;
//   }
// };

// /**
//  * Generic DELETE request
//  */
// export const del = async <T = any>(
//   url: string,
//   config?: InternalAxiosRequestConfig
// ): Promise<ApiResponse<T>> => {
//   try {
//     const response = await apiClient.delete<ApiResponse<T>>(url, config);
//     return response.data;
//   } catch (error) {
//     return error as ApiResponse<T>;
//   }
// };

// /**
//  * Download file (for exports)
//  */
// export const downloadFile = async (
//   url: string,
//   config?: InternalAxiosRequestConfig
// ): Promise<Blob> => {
//   const response = await apiClient.get(url, {
//     ...config,
//     responseType: 'blob'
//   });
//   return response.data;
// };

// /**
//  * Upload file
//  */
// export const uploadFile = async <T = any>(
//   url: string,
//   file: File,
//   onUploadProgress?: (progressEvent: any) => void
// ): Promise<ApiResponse<T>> => {
//   const formData = new FormData();
//   formData.append('file', file);

//   try {
//     const response = await apiClient.post<ApiResponse<T>>(url, formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data'
//       },
//       onUploadProgress
//     });
//     return response.data;
//   } catch (error) {
//     return error as ApiResponse<T>;
//   }
// };

// export default apiClient;