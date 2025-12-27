// backend/referral-service/src/middleware/clickTracking.ts

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@newcondo/db';
import {
  extractSessionInfo,
  parseReferralCodeFromUrl,
  createAttributionCookie,
  parseAttributionCookie,
  generateClickId,
  getGeolocationFromIp,
  normalizeUserAgent,
} from '../utils/sessionTracking';

const prisma = new PrismaClient();

// Cookie configuration
const ATTRIBUTION_COOKIE_NAME = 'nc_ref_attr';
const ATTRIBUTION_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Click Tracking Middleware
 * Automatically tracks referral clicks and sets attribution cookies
 */
export async function clickTrackingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Extract referral code from query params
    const referralCode =
      req.query.ref ||
      req.query.referral ||
      req.query.referralCode ||
      parseReferralCodeFromUrl(req.originalUrl);

    if (!referralCode || typeof referralCode !== 'string') {
      return next(); // No referral code, skip tracking
    }

    // Check if this click was already tracked in this session
    const existingCookie = req.cookies?.[ATTRIBUTION_COOKIE_NAME];
    if (existingCookie) {
      const parsed = parseAttributionCookie(existingCookie);
      if (parsed && parsed.referralCode === referralCode) {
        // Already tracked this referral in current session
        return next();
      }
    }

    // Extract session info
    const sessionInfo = extractSessionInfo(req);

    // Get geolocation (optional, may be slow)
    const geo = await getGeolocationFromIp(sessionInfo.ipAddress || '');

    // Normalize user agent
    const uaInfo = normalizeUserAgent(sessionInfo.userAgent || '');

    // Find the referral and referrer
    const referral = await prisma.referral.findFirst({
      where: {
        referralCode,
        isActive: true,
      },
      select: {
        id: true,
        referrerId: true,
        status: true,
      },
    });

    if (!referral) {
      // Invalid or inactive referral code
      return next();
    }

    // Create click record
    const click = await prisma.referralClick.create({
      data: {
        referralCode,
        referrerId: referral.referrerId,
        ipAddress: sessionInfo.ipAddress,
        userAgent: sessionInfo.userAgent,
        referrerUrl: sessionInfo.referrerUrl,
        country: geo.country,
        city: geo.city,
        sessionId: sessionInfo.sessionId,
        convertedToSignup: false,
      },
    });

    // Increment click count on referral
    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        clickCount: {
          increment: 1,
        },
      },
    });

    // Set attribution cookie
    const cookieValue = createAttributionCookie({
      referralCode,
      sessionId: sessionInfo.sessionId,
      timestamp: new Date(),
    });

    res.cookie(ATTRIBUTION_COOKIE_NAME, cookieValue, {
      maxAge: ATTRIBUTION_COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    // Store attribution in request for later use
    req.referralAttribution = {
      referralCode,
      referrerId: referral.referrerId,
      sessionId: sessionInfo.sessionId,
      clickId: click.id,
    };

    // Log the click event
    await prisma.eventLog.create({
      data: {
        userId: referral.referrerId,
        type: 'REFERRAL_CLICK',
        metadata: {
          referralCode,
          clickId: click.id,
          sessionId: sessionInfo.sessionId,
          browser: uaInfo.browser,
          os: uaInfo.os,
          device: uaInfo.device,
        },
        ipAddress: sessionInfo.ipAddress,
        userAgent: sessionInfo.userAgent,
      },
    });

    next();
  } catch (error) {
    console.error('Click tracking error:', error);
    // Don't block the request if tracking fails
    next();
  }
}

/**
 * Middleware to get attribution from cookie
 * Use this when user signs up or makes a payment
 */
export function getAttributionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const cookie = req.cookies?.[ATTRIBUTION_COOKIE_NAME];
    if (!cookie) {
      return next();
    }

    const attribution = parseAttributionCookie(cookie);
    if (attribution) {
      req.referralAttribution = {
        referralCode: attribution.referralCode,
        sessionId: attribution.sessionId,
        timestamp: attribution.timestamp,
      };
    }

    next();
  } catch (error) {
    console.error('Get attribution error:', error);
    next();
  }
}

/**
 * Middleware to track conversion (signup)
 */
export async function trackConversionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // This should be called after user signup is successful
    const attribution = req.referralAttribution;
    const newUserId = req.body.userId || res.locals.userId;

    if (!attribution || !newUserId) {
      return next();
    }

    // Update click record to mark conversion
    await prisma.referralClick.updateMany({
      where: {
        referralCode: attribution.referralCode,
        sessionId: attribution.sessionId,
        convertedToSignup: false,
      },
      data: {
        convertedToSignup: true,
        convertedUserId: newUserId,
        convertedAt: new Date(),
      },
    });

    // Create or update referral record
    const referral = await prisma.referral.findFirst({
      where: {
        referralCode: attribution.referralCode,
      },
    });

    if (referral) {
      // Update existing referral with referred user
      await prisma.referral.update({
        where: { id: referral.id },
        data: {
          referredId: newUserId,
          status: 'PENDING', // Now waiting for qualification
        },
      });
    }

    // Log conversion event
    await prisma.eventLog.create({
      data: {
        userId: newUserId,
        type: 'REFERRAL_CONVERSION',
        metadata: {
          referralCode: attribution.referralCode,
          referrerId: referral?.referrerId,
          sessionId: attribution.sessionId,
        },
      },
    });

    // Clear attribution cookie after conversion
    res.clearCookie(ATTRIBUTION_COOKIE_NAME);

    next();
  } catch (error) {
    console.error('Track conversion error:', error);
    next();
  }
}

/**
 * Middleware to track agent referral clicks (for property promotion)
 */
export async function trackAgentReferralClick(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const referralCode =
      req.query.ref || req.query.agentRef || req.query.promotionCode;

    if (!referralCode || typeof referralCode !== 'string') {
      return next();
    }

    const sessionInfo = extractSessionInfo(req);
    const geo = await getGeolocationFromIp(sessionInfo.ipAddress || '');

    // Find agent referral
    const agentReferral = await prisma.agentReferral.findUnique({
      where: { referralCode },
      include: {
        property: {
          select: { id: true, title: true },
        },
      },
    });

    if (!agentReferral || !agentReferral.isActive) {
      return next();
    }

    // Create click record
    await prisma.agentReferralClick.create({
      data: {
        referralId: agentReferral.id,
        ipAddress: sessionInfo.ipAddress,
        userAgent: sessionInfo.userAgent,
        referrerUrl: sessionInfo.referrerUrl,
        country: geo.country,
        city: geo.city,
      },
    });

    // Increment click counters
    await prisma.agentReferral.update({
      where: { id: agentReferral.id },
      data: {
        uniqueClicks: {
          increment: 1,
        },
      },
    });

    // Store in request for later use
    req.agentReferralAttribution = {
      referralId: agentReferral.id,
      agentId: agentReferral.agentId,
      propertyId: agentReferral.propertyId,
      referralCode,
    };

    // Set agent referral cookie
    res.cookie('nc_agent_ref', referralCode, {
      maxAge: ATTRIBUTION_COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    next();
  } catch (error) {
    console.error('Agent referral click tracking error:', error);
    next();
  }
}

/**
 * Utility to clear all referral cookies
 */
export function clearReferralCookies(res: Response) {
  res.clearCookie(ATTRIBUTION_COOKIE_NAME);
  res.clearCookie('nc_agent_ref');
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      referralAttribution?: {
        referralCode: string;
        referrerId?: string;
        sessionId: string;
        clickId?: string;
        timestamp?: Date;
      };
      agentReferralAttribution?: {
        referralId: string;
        agentId: string;
        propertyId: string;
        referralCode: string;
      };
    }
  }
}