// apps/platform/lib/api/auth.ts
import { apiClient, ApiResponse } from "./client";
import type {
  RegisterData,
  LoginData,
  OTPVerificationData,
  OTPResendData,
  AuthResponse,
  User,
} from "@/types/api";

const AUTH_ENDPOINTS = {
  REGISTER: "/auth/register",
  LOGIN: "/auth/login",
  LOGOUT: "/auth/logout",
  VERIFY_OTP: "/otp/verify",
  RESEND_OTP: "/otp/resend",
  REQUEST_PASSWORD_RESET: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  UPDATE_PROFILE: "/auth/profile",
  GET_PROFILE: "/auth/me",
  REFRESH_TOKEN: "/auth/refresh",
} as const;

export const authApi = {
  // Register new user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>(
        AUTH_ENDPOINTS.REGISTER,
        data
      );
      // return response.data
      return {
        success: true,
        user: response.data!.user,
        token: response.data!.token,
        refreshToken: response.data!.refreshToken,
        expiresAt: response.data!.expiresAt,
        message: response.message,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "Registration failed",
      };
    }
  },

  // Login user
  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>(
        AUTH_ENDPOINTS.LOGIN,
        data
      );
      // return response.data
      return {
        success: true,
        user: response.data!.user,
        token: response.data!.token,
        refreshToken: response.data!.refreshToken,
        expiresAt: response.data!.expiresAt,
        message: response.message,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "Login failed",
      };
    }
  },

  // Logout user
  logout: async (): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>(AUTH_ENDPOINTS.LOGOUT);
      // return response.data
      return {
        success: true,
        user: response.data!.user,
        token: response.data!.token,
        refreshToken: response.data!.refreshToken,
        expiresAt: response.data!.expiresAt,
        message: response.message,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "Logout failed",
      };
    }
  },

  // Verify OTP
  verifyOTP: async (data: OTPVerificationData): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>(
        AUTH_ENDPOINTS.VERIFY_OTP,
        data
      );
      // return response.data
      return {
        success: true,
        user: response.data!.user,
        token: response.data!.token,
        refreshToken: response.data!.refreshToken,
        expiresAt: response.data!.expiresAt,
        message: response.message,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "OTP verification failed",
      };
    }
  },

  // Resend OTP
  resendOTP: async (data: OTPResendData): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>(
        AUTH_ENDPOINTS.RESEND_OTP,
        data
      );
      // return response.data
      return {
        success: true,
        user: response.data!.user,
        token: response.data!.token,
        refreshToken: response.data!.refreshToken,
        expiresAt: response.data!.expiresAt,
        message: response.message,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to resend OTP",
      };
    }
  },

  // Request password reset
  requestPasswordReset: async (email: string): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>(
        AUTH_ENDPOINTS.REQUEST_PASSWORD_RESET,
        { email }
      );
      // return response.data
      return {
        success: true,
        user: response.data!.user,
        token: response.data!.token,
        refreshToken: response.data!.refreshToken,
        expiresAt: response.data!.expiresAt,
        message: response.message,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.message || "Failed to request password reset",
      };
    }
  },

  // Reset password with token
  resetPassword: async (
    token: string,
    newPassword: string
  ): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>(
        AUTH_ENDPOINTS.RESET_PASSWORD,
        {
          token,
          newPassword,
        }
      );
      // return response.data
      return {
        success: true,
        user: response.data!.user,
        token: response.data!.token,
        refreshToken: response.data!.refreshToken,
        expiresAt: response.data!.expiresAt,
        message: response.message,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to reset password",
      };
    }
  },

  // Update user profile
  updateProfile: async (data: Partial<User>): Promise<AuthResponse> => {
    try {
      const response = await apiClient.put<ApiResponse>(
        AUTH_ENDPOINTS.UPDATE_PROFILE,
        data
      );
      // return response.data
      return {
        success: true,
        user: response.data!.user,
        token: response.data!.token,
        refreshToken: response.data!.refreshToken,
        expiresAt: response.data!.expiresAt,
        message: response.message,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to update profile",
      };
    }
  },

  // Get current user profile
  getProfile: async (): Promise<AuthResponse> => {
    try {
      const response = await apiClient.get<ApiResponse>(
        AUTH_ENDPOINTS.GET_PROFILE
      );
      // return response.data
      return {
        success: true,
        user: response.data!.user,
        token: response.data!.token,
        refreshToken: response.data!.refreshToken,
        expiresAt: response.data!.expiresAt,
        message: response.message,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to get profile",
      };
    }
  },

  // Refresh authentication token
  refreshToken: async (): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>(
        AUTH_ENDPOINTS.REFRESH_TOKEN
      );
      // return response.data
      return {
        success: true,
        user: response.data!.user,
        token: response.data!.token,
        refreshToken: response.data!.refreshToken,
        expiresAt: response.data!.expiresAt,
        message: response.message,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to refresh token",
      };
    }
  },
};
