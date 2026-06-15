// apps/platform/lib/api/auth.ts
// import { UnknownKeysParam } from "zod";
import { apiClient, ApiResponse } from "./client";
import type {
  RegisterData,
  LoginData,
  OTPVerificationData,
  OTPResendData,
  AuthResponse,
  User,
} from "@/types/api";

// auth route
// first the base route is "https://newcondo.onrender.com/api/v1"
// then the auth route is "auth/*" like the example below
// https://newcondo.onrender.com/api/v1/auth/test
const AUTH_ENDPOINTS = {
  REGISTER: "/auth/register",
  LOGIN: "/auth/login",
  LOGOUT: "/auth/logout",
  VERIFY_OTP: "/auth/verify-otp",
  RESEND_OTP: "/auth/resend-otp",
  SEND_OTP: "/auth/send-otp",
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
      const { firstName, lastName, name, ...restOfData } = data;

      // Construct the new payload with the combined 'name' and the rest of the data
      const payload = {
        ...restOfData, // Includes all other properties from the original 'data'
        name, // Adds the new 'name' property
      };

      const response = await apiClient.post<ApiResponse>(
        AUTH_ENDPOINTS.REGISTER,
        payload
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Registration failed";
      return {
        success: false,
        error: errorMessage,
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      return {
        success: false,
        error: errorMessage,
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Logout failed";
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // SendOTP
  sendOTP: async (data: OTPResendData): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>(
        AUTH_ENDPOINTS.SEND_OTP,
        data
      );

      return {
        success: true,
        user: response.data!.user,
        token: response.data!.token,
        refreshToken: response.data!.refreshToken,
        expiresAt: response.data!.expiresAt,
        message: response.message,
        data: response.data,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "OTP verification failed";
      return {
        success: false,
        error: errorMessage,
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "OTP verification failed";
      return {
        success: false,
        error: errorMessage,
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to resend OTP";
      return {
        success: false,
        error: errorMessage,
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to request password reset";
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // Reset password with token
  resetPassword: async (
    token: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>(
        AUTH_ENDPOINTS.RESET_PASSWORD,
        {
          token,
          newPassword,
          confirmPassword,
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to reset password";
      return {
        success: false,
        error: errorMessage,
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update profile";
      return {
        success: false,
        error: errorMessage,
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to get profile";
      return {
        success: false,
        error: errorMessage,
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to refresh token";
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};

// you may add session routes for
// getSessions, terminateSession, terminateAllSessions etc
