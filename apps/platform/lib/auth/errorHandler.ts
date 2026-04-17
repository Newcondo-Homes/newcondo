/* eslint-disable @typescript-eslint/no-explicit-any */

// apps/platform/lib/auth/errorHandler.ts
import { toast } from "@newcondo/ui";

export interface AuthError {
  code: string;
  message: string;
  field?: string;
  statusCode?: number;
}

interface ValidationError extends Error {
  field?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  errors?: AuthError[];
  statusCode?: number;
}

export class AuthErrorHandler {
  private static readonly ERROR_MESSAGES: Record<string, string> = {
    // Authentication errors
    INVALID_CREDENTIALS: "Invalid email or password",
    USER_NOT_FOUND: "User not found",
    USER_ALREADY_EXISTS: "User already exists with this email",
    ACCOUNT_LOCKED:
      "Account temporarily locked due to multiple failed attempts",
    ACCOUNT_SUSPENDED: "Account has been suspended",
    ACCOUNT_NOT_VERIFIED: "Please verify your account before logging in",

    // OTP errors
    OTP_EXPIRED: "OTP has expired. Please request a new one",
    OTP_INVALID: "Invalid OTP code",
    OTP_MAX_ATTEMPTS: "Maximum OTP attempts exceeded",
    OTP_COOLDOWN: "Please wait before requesting another OTP",
    OTP_NOT_FOUND: "OTP not found or expired",

    // Password errors
    PASSWORD_TOO_WEAK: "Password does not meet security requirements",
    PASSWORD_MISMATCH: "Passwords do not match",
    CURRENT_PASSWORD_INCORRECT: "Current password is incorrect",

    // Session errors
    SESSION_EXPIRED: "Your session has expired. Please log in again",
    INVALID_TOKEN: "Invalid authentication token",
    TOKEN_EXPIRED: "Authentication token has expired",

    // Rate limiting
    RATE_LIMIT_EXCEEDED: "Too many requests. Please try again later",
    LOGIN_ATTEMPTS_EXCEEDED: "Too many login attempts. Please try again later",

    // Validation errors
    INVALID_EMAIL: "Please enter a valid email address",
    INVALID_PHONE: "Please enter a valid phone number",
    REQUIRED_FIELD: "This field is required",
    INVALID_USER_TYPE: "Please select a valid user type",

    // Network errors
    NETWORK_ERROR: "Network error. Please check your connection",
    SERVER_ERROR: "Server error. Please try again later",
    TIMEOUT_ERROR: "Request timed out. Please try again",

    // Default
    UNKNOWN_ERROR: "An unexpected error occurred",
  };

  // Type guard helper method
  private static isApiError(
    error: unknown
  ): error is { response: { status: number; data: any } } {
    return (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      typeof (error as any).response === "object" &&
      (error as any).response !== null &&
      "status" in (error as any).response
    );
  }
  /**
   * Handle authentication errors and display appropriate messages
   */
  static handleError(error: unknown): AuthError {
    console.error("Auth Error:", error);

    // Handle network errors
    if (!navigator.onLine) {
      const authError: AuthError = {
        code: "NETWORK_ERROR",
        message: this.ERROR_MESSAGES.NETWORK_ERROR,
      };
      this.showErrorToast(authError);
      return authError;
    }

    // Handle API response errors
    if (this.isApiError(error)) {
      const { status, data } = error.response;

      if (data && data.code) {
        const authError: AuthError = {
          code: data.code,
          message:
            this.ERROR_MESSAGES[data.code] ||
            data.message ||
            this.ERROR_MESSAGES.UNKNOWN_ERROR,
          field: data.field,
          statusCode: status,
        };
        this.showErrorToast(authError);
        return authError;
      }

      // Handle HTTP status codes
      const statusError = this.handleHttpStatus(status);
      this.showErrorToast(statusError);
      return statusError;
    }

    // Handle request errors
    if (this.isApiError(error)) {
      const authError: AuthError = {
        code: "NETWORK_ERROR",
        message: this.ERROR_MESSAGES.NETWORK_ERROR,
      };
      this.showErrorToast(authError);
      return authError;
    }

    // Handle validation errors
    if (error instanceof Error) {
      const authError: AuthError = {
        code: "VALIDATION_ERROR",
        message: error.message || "Please check your input",
        field: "field" in error ? (error as ValidationError).field : undefined,
      };
      this.showErrorToast(authError);
      return authError;
    }

    // Handle unknown errors
    const authError: AuthError = {
      code: "UNKNOWN_ERROR",
      message:
        (error instanceof Error ? error.message : undefined) ||
        this.ERROR_MESSAGES.UNKNOWN_ERROR,
    };
    this.showErrorToast(authError);
    return authError;
  }

  /**
   * Handle multiple validation errors
   */
  static handleValidationErrors(errors: AuthError[]): void {
    errors.forEach((error) => {
      this.showErrorToast(error);
    });
  }

  /**
   * Handle HTTP status codes
   */
  private static handleHttpStatus(status: number): AuthError {
    switch (status) {
      case 400:
        return {
          code: "BAD_REQUEST",
          message: "Invalid request. Please check your input",
          statusCode: status,
        };
      case 401:
        return {
          code: "UNAUTHORIZED",
          message: "Invalid credentials or session expired",
          statusCode: status,
        };
      case 403:
        return {
          code: "FORBIDDEN",
          message: "Access denied",
          statusCode: status,
        };
      case 404:
        return {
          code: "NOT_FOUND",
          message: "Resource not found",
          statusCode: status,
        };
      case 422:
        return {
          code: "VALIDATION_ERROR",
          message: "Please check your input",
          statusCode: status,
        };
      case 429:
        return {
          code: "RATE_LIMIT_EXCEEDED",
          message: this.ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
          statusCode: status,
        };
      case 500:
        return {
          code: "SERVER_ERROR",
          message: this.ERROR_MESSAGES.SERVER_ERROR,
          statusCode: status,
        };
      default:
        return {
          code: "UNKNOWN_ERROR",
          message: this.ERROR_MESSAGES.UNKNOWN_ERROR,
          statusCode: status,
        };
    }
  }

  /**
   * Show error toast notification
   */
  private static showErrorToast(error: AuthError): void {
    toast.error(error.message, {
      description:
        error.code !== "UNKNOWN_ERROR" ? `Error: ${error.code}` : undefined,
      duration: 5000,
    });
  }

  /**
   * Get user-friendly error message
   */
  static getErrorMessage(code: string): string {
    return this.ERROR_MESSAGES[code] || this.ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  /**
   * Check if error requires user action
   */
  static requiresUserAction(code: string): boolean {
    const actionRequiredCodes = [
      "ACCOUNT_NOT_VERIFIED",
      "OTP_EXPIRED",
      "PASSWORD_TOO_WEAK",
      "SESSION_EXPIRED",
    ];
    return actionRequiredCodes.includes(code);
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(code: string): boolean {
    const retryableCodes = [
      "NETWORK_ERROR",
      "SERVER_ERROR",
      "TIMEOUT_ERROR",
      "OTP_COOLDOWN",
    ];
    return retryableCodes.includes(code);
  }

  /**
   * Get retry delay in seconds
   */
  static getRetryDelay(code: string): number {
    const delays: Record<string, number> = {
      NETWORK_ERROR: 5,
      SERVER_ERROR: 10,
      TIMEOUT_ERROR: 3,
      OTP_COOLDOWN: 60,
      RATE_LIMIT_EXCEEDED: 300,
    };
    return delays[code] || 5;
  }
}
