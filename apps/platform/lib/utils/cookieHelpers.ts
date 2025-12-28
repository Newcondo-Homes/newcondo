// apps/platform/lib/utils/cookieHelpers.ts
import Cookies from "js-cookie";

export interface CookieOptions {
  expires?: number | Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
}

/**
 * Set a cookie with the given name, value, and options
 */
export function setCookie(
  name: string,
  value: string,
  options?: CookieOptions
): void {
  const defaultOptions: CookieOptions = {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  };

  Cookies.set(name, value, { ...defaultOptions, ...options });
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | undefined {
  return Cookies.get(name);
}

/**
 * Remove a cookie by name
 */
export function removeCookie(name: string, options?: CookieOptions): void {
  const defaultOptions: CookieOptions = {
    path: "/",
  };

  Cookies.remove(name, { ...defaultOptions, ...options });
}

/**
 * Check if a cookie exists
 */
export function hasCookie(name: string): boolean {
  return Cookies.get(name) !== undefined;
}

/**
 * Get all cookies as an object
 */
export function getAllCookies(): { [key: string]: string } {
  return Cookies.get();
}

/**
 * Referral-specific cookie helpers
 */
export const referralCookies = {
  REFERRAL_CODE: "newcondo_referral_code",
  REFERRAL_SOURCE: "newcondo_referral_source",
  REFERRAL_TIMESTAMP: "newcondo_referral_timestamp",
  SESSION_ID: "newcondo_session_id",
  EXPIRY_DAYS: 90,

  /**
   * Set referral tracking cookies
   */
  setReferralTracking(
    code: string,
    source?: string,
    sessionId?: string
  ): boolean {
    // Don't overwrite existing referral (first-touch attribution)
    if (this.hasReferralCode()) {
      return false;
    }

    try {
      // Set referral code
      setCookie(this.REFERRAL_CODE, code, {
        expires: this.EXPIRY_DAYS,
      });

      // Set source if provided
      if (source) {
        setCookie(this.REFERRAL_SOURCE, source, {
          expires: this.EXPIRY_DAYS,
        });
      }

      // Set timestamp
      setCookie(this.REFERRAL_TIMESTAMP, Date.now().toString(), {
        expires: this.EXPIRY_DAYS,
      });

      // Set or create session ID
      if (sessionId) {
        setCookie(this.SESSION_ID, sessionId, {
          expires: this.EXPIRY_DAYS,
        });
      } else if (!this.getSessionId()) {
        setCookie(this.SESSION_ID, this.generateSessionId(), {
          expires: this.EXPIRY_DAYS,
        });
      }

      return true;
    } catch (error) {
      console.error("Error setting referral cookies:", error);
      return false;
    }
  },

  /**
   * Get referral code from cookie
   */
  getReferralCode(): string | null {
    return getCookie(this.REFERRAL_CODE) || null;
  },

  /**
   * Get referral source from cookie
   */
  getReferralSource(): string | null {
    return getCookie(this.REFERRAL_SOURCE) || null;
  },

  /**
   * Get referral timestamp
   */
  getReferralTimestamp(): number | null {
    const timestamp = getCookie(this.REFERRAL_TIMESTAMP);
    return timestamp ? parseInt(timestamp, 10) : null;
  },

  /**
   * Get session ID
   */
  getSessionId(): string | null {
    return getCookie(this.SESSION_ID) || null;
  },

  /**
   * Check if referral code exists
   */
  hasReferralCode(): boolean {
    return hasCookie(this.REFERRAL_CODE);
  },

  /**
   * Check if referral is expired
   */
  isExpired(): boolean {
    const timestamp = this.getReferralTimestamp();
    if (!timestamp) return false;

    const now = Date.now();
    const elapsed = now - timestamp;
    const elapsedDays = elapsed / (1000 * 60 * 60 * 24);

    return elapsedDays > this.EXPIRY_DAYS;
  },

  /**
   * Get days remaining until expiration
   */
  getDaysRemaining(): number | null {
    const timestamp = this.getReferralTimestamp();
    if (!timestamp) return null;

    const now = Date.now();
    const elapsed = now - timestamp;
    const elapsedDays = Math.floor(elapsed / (1000 * 60 * 60 * 24));
    return Math.max(0, this.EXPIRY_DAYS - elapsedDays);
  },

  /**
   * Get all referral data
   */
  getReferralData() {
    return {
      code: this.getReferralCode(),
      source: this.getReferralSource(),
      timestamp: this.getReferralTimestamp(),
      sessionId: this.getSessionId(),
      daysRemaining: this.getDaysRemaining(),
      isExpired: this.isExpired(),
    };
  },

  /**
   * Clear all referral cookies
   */
  clearReferralData(): void {
    removeCookie(this.REFERRAL_CODE);
    removeCookie(this.REFERRAL_SOURCE);
    removeCookie(this.REFERRAL_TIMESTAMP);
    // Keep session ID for other tracking purposes
  },

  /**
   * Generate a unique session ID
   */
  generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  },
};

/**
 * User preference cookies
 */
export const userPreferenceCookies = {
  THEME: "newcondo_theme",
  LANGUAGE: "newcondo_language",
  REFERRAL_BANNER_DISMISSED: "newcondo_referral_banner_dismissed",
  EXPIRING_REWARDS_DISMISSED: "newcondo_expiring_rewards_dismissed",

  /**
   * Set theme preference
   */
  setTheme(theme: "light" | "dark" | "system"): void {
    setCookie(this.THEME, theme, { expires: 365 });
  },

  /**
   * Get theme preference
   */
  getTheme(): "light" | "dark" | "system" | null {
    return (getCookie(this.THEME) as "light" | "dark" | "system") || null;
  },

  /**
   * Dismiss referral banner
   */
  dismissReferralBanner(): void {
    setCookie(this.REFERRAL_BANNER_DISMISSED, "true", { expires: 7 });
  },

  /**
   * Check if referral banner was dismissed
   */
  isReferralBannerDismissed(): boolean {
    return getCookie(this.REFERRAL_BANNER_DISMISSED) === "true";
  },

  /**
   * Dismiss expiring rewards alert for specific reward IDs
   */
  dismissExpiringRewards(rewardIds: string[]): void {
    const existing = this.getDismissedExpiringRewards();
    const updated = [...new Set([...existing, ...rewardIds])];
    setCookie(this.EXPIRING_REWARDS_DISMISSED, JSON.stringify(updated), {
      expires: 30,
    });
  },

  /**
   * Get dismissed expiring reward IDs
   */
  getDismissedExpiringRewards(): string[] {
    const value = getCookie(this.EXPIRING_REWARDS_DISMISSED);
    if (!value) return [];

    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  },
};

/**
 * Consent cookies for GDPR/privacy compliance
 */
export const consentCookies = {
  CONSENT: "newcondo_consent",
  CONSENT_DATE: "newcondo_consent_date",

  /**
   * Set user consent
   */
  setConsent(
    analytics: boolean,
    marketing: boolean,
    preferences: boolean
  ): void {
    const consent = {
      analytics,
      marketing,
      preferences,
      necessary: true, // Always true
    };

    setCookie(this.CONSENT, JSON.stringify(consent), {
      expires: 365,
    });

    setCookie(this.CONSENT_DATE, new Date().toISOString(), {
      expires: 365,
    });
  },

  /**
   * Get user consent
   */
  getConsent(): {
    analytics: boolean;
    marketing: boolean;
    preferences: boolean;
    necessary: boolean;
  } | null {
    const value = getCookie(this.CONSENT);
    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  },

  /**
   * Check if user has given consent
   */
  hasConsent(): boolean {
    return hasCookie(this.CONSENT);
  },
};

/**
 * Utility to check if cookies are enabled in the browser
 */
export function areCookiesEnabled(): boolean {
  try {
    const testCookie = "__cookie_test__";
    setCookie(testCookie, "test");
    const enabled = hasCookie(testCookie);
    removeCookie(testCookie);
    return enabled;
  } catch {
    return false;
  }
}