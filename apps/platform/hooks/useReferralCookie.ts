// apps/platform/hooks/useReferralCookie.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import Cookies from "js-cookie";

const REFERRAL_CODE_COOKIE = "newcondo_referral_code";
const REFERRAL_SOURCE_COOKIE = "newcondo_referral_source";
const REFERRAL_TIMESTAMP_COOKIE = "newcondo_referral_timestamp";
const COOKIE_EXPIRY_DAYS = 90; // 90 days attribution window

interface ReferralData {
  code: string | null;
  source: string | null;
  timestamp: number | null;
  daysRemaining: number | null;
}

export function useReferralCookie() {
  const [referralData, setReferralData] = useState<ReferralData>({
    code: null,
    source: null,
    timestamp: null,
    daysRemaining: null,
  });

  // Get referral data from cookies
  const getReferralData = useCallback((): ReferralData => {
    const code = Cookies.get(REFERRAL_CODE_COOKIE) || null;
    const source = Cookies.get(REFERRAL_SOURCE_COOKIE) || null;
    const timestamp = Cookies.get(REFERRAL_TIMESTAMP_COOKIE);

    const timestampNum = timestamp ? parseInt(timestamp, 10) : null;
    let daysRemaining = null;

    if (timestampNum) {
      const now = Date.now();
      const elapsed = now - timestampNum;
      const elapsedDays = Math.floor(elapsed / (1000 * 60 * 60 * 24));
      daysRemaining = Math.max(0, COOKIE_EXPIRY_DAYS - elapsedDays);
    }

    return {
      code,
      source,
      timestamp: timestampNum,
      daysRemaining,
    };
  }, []);

  // Set referral code in cookie
  const setReferralCode = useCallback(
    (code: string, source?: string): boolean => {
      // Don't overwrite existing referral code (first-touch attribution)
      const existingCode = Cookies.get(REFERRAL_CODE_COOKIE);
      if (existingCode) {
        console.log("Referral code already set, skipping...");
        return false;
      }

      // Validate referral code format
      if (!code || code.length < 3) {
        console.error("Invalid referral code");
        return false;
      }

      try {
        // Set cookies with expiration
        Cookies.set(REFERRAL_CODE_COOKIE, code, {
          expires: COOKIE_EXPIRY_DAYS,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });

        if (source) {
          Cookies.set(REFERRAL_SOURCE_COOKIE, source, {
            expires: COOKIE_EXPIRY_DAYS,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          });
        }

        Cookies.set(REFERRAL_TIMESTAMP_COOKIE, Date.now().toString(), {
          expires: COOKIE_EXPIRY_DAYS,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });

        // Update state
        setReferralData(getReferralData());

        return true;
      } catch (error) {
        console.error("Error setting referral cookie:", error);
        return false;
      }
    },
    [getReferralData]
  );

  // Clear referral cookies (usually after successful signup/attribution)
  const clearReferralData = useCallback(() => {
    Cookies.remove(REFERRAL_CODE_COOKIE);
    Cookies.remove(REFERRAL_SOURCE_COOKIE);
    Cookies.remove(REFERRAL_TIMESTAMP_COOKIE);
    setReferralData({
      code: null,
      source: null,
      timestamp: null,
      daysRemaining: null,
    });
  }, []);

  // Check if referral is expired
  const isExpired = useCallback((): boolean => {
    const timestamp = Cookies.get(REFERRAL_TIMESTAMP_COOKIE);
    if (!timestamp) return false;

    const timestampNum = parseInt(timestamp, 10);
    const now = Date.now();
    const elapsed = now - timestampNum;
    const elapsedDays = elapsed / (1000 * 60 * 60 * 24);

    return elapsedDays > COOKIE_EXPIRY_DAYS;
  }, []);

  // Track referral click (for analytics)
  const trackReferralClick = useCallback(
    async (referralCode: string, source?: string) => {
      try {
        const response = await fetch("/api/referrals/track-click", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            referralCode,
            source: source || "direct",
            userAgent: navigator.userAgent,
            referrerUrl: document.referrer,
            landingPage: window.location.href,
          }),
        });

        if (!response.ok) {
          console.warn("Failed to track referral click");
        }
      } catch (error) {
        console.error("Error tracking referral click:", error);
      }
    },
    []
  );

  // Initialize on mount
  useEffect(() => {
    // Check if expired and clean up
    if (isExpired()) {
      clearReferralData();
    } else {
      setReferralData(getReferralData());
    }
  }, [isExpired, clearReferralData, getReferralData]);

  // Check URL parameters for referral code on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get("ref") || urlParams.get("referral");
    const source = urlParams.get("source") || urlParams.get("utm_source");

    if (refCode) {
      const success = setReferralCode(refCode, source || undefined);
      if (success) {
        // Track the click
        trackReferralClick(refCode, source || undefined);

        // Clean URL (optional - removes ref parameter)
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("ref");
        cleanUrl.searchParams.delete("referral");
        cleanUrl.searchParams.delete("source");
        cleanUrl.searchParams.delete("utm_source");

        window.history.replaceState({}, document.title, cleanUrl.toString());
      }
    }
  }, [setReferralCode, trackReferralClick]);

  return {
    referralData,
    setReferralCode,
    clearReferralData,
    isExpired: isExpired(),
    hasReferral: !!referralData.code,
    trackReferralClick,
  };
}

// Utility hook for getting referral code during signup
export function useSignupReferral() {
  const { referralData, clearReferralData } = useReferralCookie();

  const applyReferralToSignup = useCallback(
    (userId: string) => {
      if (!referralData.code) return null;

      // Return the referral code to be saved with user signup
      const referralInfo = {
        code: referralData.code,
        source: referralData.source || "direct",
        appliedAt: new Date().toISOString(),
      };

      // Clear the cookie after successful application
      clearReferralData();

      return referralInfo;
    },
    [referralData, clearReferralData]
  );

  return {
    referralCode: referralData.code,
    referralSource: referralData.source,
    daysRemaining: referralData.daysRemaining,
    applyReferralToSignup,
  };
}