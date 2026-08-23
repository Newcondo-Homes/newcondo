/* ============================================================
   lib/api/profile-settings.ts

   Wires the Profile & Settings page to the EXISTING backend endpoints:

     GET    /auth/profile            profileController.getProfile
     PUT    /auth/profile            profileController.updateProfile   (name etc.)
     PUT    /auth/profile/email      profileController.updateEmail     (otp + password)
     PUT    /auth/profile/phone      profileController.updatePhone     (otp + password)
     POST   /otp/send                otpController.sendOTP             (code to the NEW value)

   No new backend model. The pending change is the OTPCode row itself: its
   `identifier` IS the new email or phone, so the value being confirmed lives in
   the code table until it is proven, and updateEmail/updatePhone commit only
   after otpService.verifyOTP succeeds. Uniqueness is re-checked at commit.

   Two tiers, by risk:
     name           → PUT /auth/profile, saves immediately. Cosmetic.
     email / phone  → send OTP to the new value → PUT with { value, otp, password }.

   Why the password as well as the code: email and phone are password-RESET
   channels. The OTP proves the new address is reachable, but says nothing about
   who asked for the change — so without a password, anyone on an unlocked
   laptop could repoint the account to their own address using a code they
   receive themselves. Social-only accounts have no password to check, so the
   OTP alone carries the proof for them.
   ============================================================ */

import { apiClient } from "./client";

const unwrap = <T,>(r: { data?: T }) => r.data as T;

export interface ProfileRecord {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  emailVerified: string | null;
  phoneVerified: string | null;
  image: string | null;
  role: string;
  verificationStatus: string;
  dateOfBirth: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  isPremium: boolean;
  premiumExpiresAt: string | null;
  referralCode: string | null;
  isAvailableForMarking: boolean;
  agentServiceAreas: string[] | null;
  agentReliabilityScore: number | null;
  totalMarkingJobs: number;
  completedMarkingJobs: number;
  createdAt: string;
  updatedAt: string;
}

/** Authoritative profile — the session's JWT claims can be days stale. */
export const getProfile = () => apiClient.get<ProfileRecord>("/auth/profile").then(unwrap);

/**
 * Name and other descriptive fields. The service whitelists what it accepts
 * (name, image, dateOfBirth, address, city, state, country,
 * isAvailableForMarking, agentServiceAreas) and silently drops anything else —
 * so email and phone genuinely cannot slip through this endpoint.
 */
export const updateProfileFields = (body: {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  isAvailableForMarking?: boolean;
}) => apiClient.put<ProfileRecord>("/auth/profile", body).then(unwrap);

/**
 * Send a code to the value being CLAIMED, not to the current one — that is what
 * proves the new mailbox or number actually reaches this person.
 *
 * `type` must match what the commit step verifies against:
 *   email → EMAIL_VERIFICATION   (profileService.updateEmail)
 *   phone → PHONE_VERIFICATION   (profileService.updatePhone)
 * A mismatch fails verification with a confusing "invalid or expired" error.
 */
export const sendContactOtp = (identifier: string, kind: "email" | "phone") =>
  apiClient
    .post<{ identifier: string; expiresIn?: number }>("/otp/send", {
      identifier,
      type: kind === "email" ? "EMAIL_VERIFICATION" : "PHONE_VERIFICATION",
    })
    .then(unwrap);

export const resendContactOtp = (identifier: string, kind: "email" | "phone") =>
  apiClient
    .post<{ identifier: string }>("/otp/resend", {
      identifier,
      type: kind === "email" ? "EMAIL_VERIFICATION" : "PHONE_VERIFICATION",
    })
    .then(unwrap);

/** Commit the email change. Password omitted for social-only accounts. */
export const commitEmailChange = (body: { email: string; otp: string; password?: string }) =>
  apiClient
    .put<{ id: string; email: string; emailVerified: string }>("/auth/profile/email", body)
    .then(unwrap);

/** Commit the phone change. */
export const commitPhoneChange = (body: { phone: string; otp: string; password?: string }) =>
  apiClient
    .put<{ id: string; phone: string; phoneVerified: string }>("/auth/profile/phone", body)
    .then(unwrap);

/* ============================================================
   SMS: there is no provider wired yet — otpController.sendPhoneOtp has the
   sendSMS call commented out. So a phone-change code cannot currently be
   delivered to the phone. Until Termii/Twilio lands, the UI says so plainly
   rather than pretending, and the SMS notification toggle stays disabled.
   ============================================================ */
