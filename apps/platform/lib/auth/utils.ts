// apps/platform/lib/auth/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface PasswordStrength {
  score: number; // 0-5
  feedback: string[];
  isValid: boolean;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export class AuthUtils {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number (Nigerian format)
   */
  static isValidPhone(phone: string): boolean {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check for Nigerian phone number patterns
    const nigerianPatterns = [
      /^234[789]\d{9}$/, // +234 format
      /^0[789]\d{9}$/, // 0 format
      /^[789]\d{9}$/ // Without prefix
    ];

    return nigerianPatterns.some(pattern => pattern.test(cleaned));
  }

  /**
   * Format phone number to Nigerian format
   */
  static formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('234')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      return `+234${cleaned.slice(1)}`;
    } else if (cleaned.length === 10) {
      return `+234${cleaned}`;
    }
    
    return phone;
  }

  /**
   * Check password strength
   */
  static checkPasswordStrength(password: string): PasswordStrength {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const metRequirements = Object.values(requirements).filter(Boolean).length;
    const score = Math.min(metRequirements, 5);

    const feedback: string[] = [];
    if (!requirements.length) feedback.push('Password must be at least 8 characters long');
    if (!requirements.uppercase) feedback.push('Add at least one uppercase letter');
    if (!requirements.lowercase) feedback.push('Add at least one lowercase letter');
    if (!requirements.number) feedback.push('Add at least one number');
    if (!requirements.special) feedback.push('Add at least one special character');

    return {
      score,
      feedback,
      isValid: score >= 4, // Require at least 4 out of 5 criteria
      requirements
    };
  }

  /**
   * Generate secure random password
   */
  static generateSecurePassword(length: number = 12): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = uppercase + lowercase + numbers + symbols;
    let password = '';
    
    // Ensure at least one character from each category
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill remaining length with random characters
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Validate OTP format
   */
  static isValidOTP(otp: string): boolean {
    return /^\d{6}$/.test(otp);
  }

  /**
   * Format OTP input (add spaces for readability)
   */
  static formatOTP(otp: string): string {
    const cleaned = otp.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})/, '$1 $2');
  }

  /**
   * Clean OTP input (remove spaces and non-digits)
   */
  static cleanOTP(otp: string): string {
    return otp.replace(/\D/g, '');
  }

  /**
   * Get user initials from name
   */
  static getUserInitials(firstName?: string, lastName?: string): string {
    if (!firstName && !lastName) return 'U';
    
    const first = firstName?.charAt(0).toUpperCase() || '';
    const last = lastName?.charAt(0).toUpperCase() || '';
    
    return first + last;
  }

  /**
   * Get user display name
   */
  static getUserDisplayName(firstName?: string, lastName?: string, email?: string): string {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (email) {
      return email.split('@')[0];
    }
    return 'User';
  }

  /**
   * Check if user type is valid
   */
  static isValidUserType(userType: string): boolean {
    const validTypes = ['RENTER', 'AGENT', 'PROPERTY_OWNER', 'PROPERTY_MANAGER'];
    return validTypes.includes(userType);
  }

  /**
   * Get user type display name
   */
  static getUserTypeDisplayName(userType: string): string {
    const displayNames: Record<string, string> = {
      'RENTER': 'Renter',
      'AGENT': 'Agent',
      'PROPERTY_OWNER': 'Property Owner',
      'PROPERTY_MANAGER': 'Property Manager'
    };
    return displayNames[userType] || userType;
  }

  /**
   * Check if session is expired
   */
  static isSessionExpired(expiresAt: string | Date): boolean {
    const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    return new Date() >= expiry;
  }

  /**
   * Get time until session expires
   */
  static getTimeUntilExpiry(expiresAt: string | Date): {
    expired: boolean;
    minutes: number;
    seconds: number;
  } {
    const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) {
      return { expired: true, minutes: 0, seconds: 0 };
    }

    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { expired: false, minutes, seconds };
  }

  /**
   * Sanitize user input
   */
  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  /**
   * Mask email for display
   */
  static maskEmail(email: string): string {
    if (!email) return '';
    
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;

    const maskedLocal = local.length > 2 
      ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
      : local;

    return `${maskedLocal}@${domain}`;
  }

  /**
   * Mask phone number for display
   */
  static maskPhone(phone: string): string {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 4) return phone;

    const masked = cleaned.slice(0, 3) + '*'.repeat(cleaned.length - 6) + cleaned.slice(-3);
    return masked;
  }

  /**
   * Generate random user ID
   */
  static generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Debounce function for input validation
   */
  static debounce<T extends (...args: unknown[]) => void>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Throttle function for API calls
   */
  static throttle<T extends (...args: unknown[]) => void>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}