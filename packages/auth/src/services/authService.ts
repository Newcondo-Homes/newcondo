// packages/auth/src/services/authService.ts
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  OTPRequest,
  OTPVerification,
  PasswordResetRequest,
} from "../types";

export class AuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
  }

  async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || "Login failed",
          error: {
            type: "AUTH_ERROR",
            message: data.message || "Login failed",
          },
        };
      }

      return {
        success: true,
        message: "Login successful",
        user: data.user,
        tokens: data.tokens,
      };
    } catch (error) {
      console.error("Sign in error:", error);
      return {
        success: false,
        message: "Network error occurred",
        error: {
          type: "NETWORK_ERROR",
          message: "Network error occurred",
        },
      };
    }
  }

  async signUp(registerData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || "Login failed",
          error: {
            type: "AUTH_ERROR",
            message: data.message || "Login failed",
          },
        };
      }

      return {
        success: true,
        message: "Login successful",
        user: data.user,
        tokens: data.tokens,
      };
    } catch (error) {
      console.error("Sign up error:", error);
      return {
        success: false,
        message: "Network error occurred",
        error: {
          type: "NETWORK_ERROR",
          message: "Network error occurred",
        },
      };
    }
  }

  async sendOTP(
    request: OTPRequest
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/otp/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || "Failed to send OTP",
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Send OTP error:", error);
      return {
        success: false,
        error: "Network error occurred",
      };
    }
  }

  async verifyOTP(verification: OTPVerification): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/otp/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(verification),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || "Login failed",
          error: {
            type: "AUTH_ERROR",
            message: data.message || "Login failed",
          },
        };
      }

      return {
        success: true,
        message: "Login successful",
        user: data.user,
        tokens: data.tokens,
      };
    } catch (error) {
      console.error("Verify OTP error:", error);
      return {
        success: false,
        message: "Network error occurred",
        error: {
          type: "NETWORK_ERROR",
          message: "Network error occurred",
        },
      };
    }
  }

  async resetPassword(
    request: PasswordResetRequest
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || "Password reset failed",
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Reset password error:", error);
      return {
        success: false,
        error: "Network error occurred",
      };
    }
  }

  async refreshSession(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || "Login failed",
          error: {
            type: "AUTH_ERROR",
            message: data.message || "Login failed",
          },
        };
      }

      return {
        success: true,
        message: "Login successful",
        user: data.user,
        tokens: data.tokens,
      };
    } catch (error) {
      console.error("Refresh session error:", error);
      return {
        success: false,
        message: "Network error occurred",
        error: {
          type: "NETWORK_ERROR",
          message: "Network error occurred",
        },
      };
    }
  }
}
