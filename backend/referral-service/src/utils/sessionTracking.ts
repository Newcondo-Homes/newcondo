// backend/referral-service/src/utils/sessionTracking.ts

import crypto from 'crypto';
import { Request } from 'express';

/**
 * Session Tracking Utility
 * Generates and manages session IDs for click attribution
 */

interface SessionInfo {
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  referrerUrl?: string;
  timestamp: Date;
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate session ID from request fingerprint
 * Creates deterministic session ID based on IP + User Agent + Date
 */
export function generateSessionFromRequest(req: Request): string {
  const ipAddress = getIpAddress(req);
  const userAgent = req.headers['user-agent'] || '';
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const fingerprint = `${ipAddress}-${userAgent}-${date}`;
  return crypto.createHash('sha256').update(fingerprint).digest('hex');
}

/**
 * Extract IP address from request
 */
export function getIpAddress(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0];
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Extract session info from request
 */
export function extractSessionInfo(req: Request): SessionInfo {
  return {
    sessionId: generateSessionFromRequest(req),
    ipAddress: getIpAddress(req),
    userAgent: req.headers['user-agent'],
    referrerUrl: req.headers['referer'] || req.headers['referrer'],
    timestamp: new Date(),
  };
}

/**
 * Validate session ID format
 */
export function isValidSessionId(sessionId: string): boolean {
  return /^[a-f0-9]{64}$/.test(sessionId);
}

/**
 * Check if session is still valid (24 hours)
 */
export function isSessionActive(sessionTimestamp: Date): boolean {
  const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
  const now = new Date().getTime();
  const sessionTime = new Date(sessionTimestamp).getTime();
  return now - sessionTime < SESSION_DURATION_MS;
}

/**
 * Parse referral code from URL
 */
export function parseReferralCodeFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const referralCode =
      urlObj.searchParams.get('ref') ||
      urlObj.searchParams.get('referral') ||
      urlObj.searchParams.get('referralCode');
    return referralCode;
  } catch {
    return null;
  }
}

/**
 * Create attribution cookie value
 */
export function createAttributionCookie(params: {
  referralCode: string;
  sessionId: string;
  timestamp: Date;
}): string {
  const data = {
    ref: params.referralCode,
    sid: params.sessionId,
    ts: params.timestamp.getTime(),
  };
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

/**
 * Parse attribution cookie
 */
export function parseAttributionCookie(cookie: string): {
  referralCode: string;
  sessionId: string;
  timestamp: Date;
} | null {
  try {
    const decoded = Buffer.from(cookie, 'base64').toString('utf-8');
    const data = JSON.parse(decoded);
    return {
      referralCode: data.ref,
      sessionId: data.sid,
      timestamp: new Date(data.ts),
    };
  } catch {
    return null;
  }
}

/**
 * Generate unique click ID
 */
export function generateClickId(): string {
  return `click_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Extract geolocation info from IP (placeholder - integrate with IP geolocation service)
 */
export async function getGeolocationFromIp(
  ipAddress: string
): Promise<{ country?: string; city?: string }> {
  // TODO: Integrate with IP geolocation service (e.g., MaxMind, IPStack)
  // For now, return empty object
  return {};
}

/**
 * Normalize user agent string
 */
export function normalizeUserAgent(userAgent: string): {
  browser?: string;
  os?: string;
  device?: string;
} {
  // Simple user agent parsing
  const ua = userAgent.toLowerCase();

  let browser: string | undefined;
  let os: string | undefined;
  let device: string | undefined;

  // Detect browser
  if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';

  // Detect OS
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad'))
    os = 'iOS';

  // Detect device type
  if (ua.includes('mobile')) device = 'Mobile';
  else if (ua.includes('tablet')) device = 'Tablet';
  else device = 'Desktop';

  return { browser, os, device };
}

/**
 * Generate referral link with tracking parameters
 */
export function generateReferralLink(
  baseUrl: string,
  referralCode: string,
  additionalParams?: Record<string, string>
): string {
  const url = new URL(baseUrl);
  url.searchParams.set('ref', referralCode);

  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
}

/**
 * Calculate session duration
 */
export function calculateSessionDuration(
  startTime: Date,
  endTime: Date = new Date()
): number {
  return endTime.getTime() - startTime.getTime();
}

/**
 * Check if IP is from a known VPN/proxy
 */
export function isVpnOrProxy(ipAddress: string): boolean {
  // TODO: Integrate with VPN/proxy detection service
  // For now, return false
  return false;
}

/**
 * Hash sensitive data for privacy
 */
export function hashSensitiveData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Create anonymous user fingerprint
 */
export function createUserFingerprint(sessionInfo: SessionInfo): string {
  const components = [
    sessionInfo.ipAddress || '',
    sessionInfo.userAgent || '',
    sessionInfo.referrerUrl || '',
  ];

  const fingerprint = components.join('|');
  return hashSensitiveData(fingerprint);
}