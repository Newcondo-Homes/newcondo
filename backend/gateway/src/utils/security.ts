// backend/gateway/src/utils/security.ts
import crypto from 'crypto';
import { Request } from 'express';
import { logger } from './logger';
import { redisClient } from '../config/redis';

export interface SecurityOptions {
  maxFailedAttempts: number;
  lockoutDuration: number; // in minutes
  enableIPWhitelist: boolean;
  enableUserAgentFiltering: boolean;
  enableRequestSigning: boolean;
}

export interface SecurityViolation {
  type: 'RATE_LIMIT' | 'SUSPICIOUS_PATTERN' | 'INVALID_SIGNATURE' | 'BLOCKED_IP' | 'MALICIOUS_USER_AGENT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ip: string;
  userAgent?: string;
  endpoint: string;
  timestamp: Date;
  details: Record<string, any>;
}

class SecurityManager {
  private options: SecurityOptions;
  private suspiciousPatterns: RegExp[];
  private blockedIPs: Set<string>;
  private whitelistedIPs: Set<string>;
  private maliciousUserAgents: RegExp[];

  constructor(options: Partial<SecurityOptions> = {}) {
    this.options = {
      maxFailedAttempts: 5,
      lockoutDuration: 15,
      enableIPWhitelist: false,
      enableUserAgentFiltering: true,
      enableRequestSigning: false,
      ...options
    };

    this.suspiciousPatterns = [
      /(\.\./|\.\.\\)/g, // Path traversal
      /<script[^>]*>.*?<\/script>/gi, // XSS
      /union\s+select/gi, // SQL injection
      /exec\s*\(/gi, // Command injection
      /eval\s*\(/gi, // Code injection
      /%27|%22|%3C|%3E/gi, // URL encoded suspicious chars
    ];

    this.blockedIPs = new Set();
    this.whitelistedIPs = new Set();

    this.maliciousUserAgents = [
      /bot|crawler|spider|scraper/gi,
      /nikto|sqlmap|burp|nessus/gi,
      /wget|curl/gi, // Consider context - might be legitimate
    ];

    this.loadBlockedIPs();
    this.loadWhitelistedIPs();
  }

  /**
   * Main security check for incoming requests
   */
  async checkRequest(req: Request): Promise<{ allowed: boolean; violation?: SecurityViolation }> {
    const clientIP = this.getClientIP(req);
    const userAgent = req.get('User-Agent') || '';
    const endpoint = req.path;

    try {
      // Check if IP is blocked
      if (await this.isIPBlocked(clientIP)) {
        const violation: SecurityViolation = {
          type: 'BLOCKED_IP',
          severity: 'HIGH',
          ip: clientIP,
          userAgent,
          endpoint,
          timestamp: new Date(),
          details: { reason: 'IP is in blocklist' }
        };
        return { allowed: false, violation };
      }

      // Check whitelist if enabled
      if (this.options.enableIPWhitelist && !this.isIPWhitelisted(clientIP)) {
        const violation: SecurityViolation = {
          type: 'BLOCKED_IP',
          severity: 'MEDIUM',
          ip: clientIP,
          userAgent,
          endpoint,
          timestamp: new Date(),
          details: { reason: 'IP not in whitelist' }
        };
        return { allowed: false, violation };
      }

      // Check user agent if enabled
      if (this.options.enableUserAgentFiltering && this.isMaliciousUserAgent(userAgent)) {
        const violation: SecurityViolation = {
          type: 'MALICIOUS_USER_AGENT',
          severity: 'MEDIUM',
          ip: clientIP,
          userAgent,
          endpoint,
          timestamp: new Date(),
          details: { userAgent }
        };
        return { allowed: false, violation };
      }

      // Check for suspicious patterns in request
      const suspiciousContent = this.checkSuspiciousPatterns(req);
      if (suspiciousContent) {
        const violation: SecurityViolation = {
          type: 'SUSPICIOUS_PATTERN',
          severity: 'HIGH',
          ip: clientIP,
          userAgent,
          endpoint,
          timestamp: new Date(),
          details: { suspiciousContent }
        };
        await this.recordSecurityViolation(violation);
        return { allowed: false, violation };
      }

      // Check request signature if enabled
      if (this.options.enableRequestSigning && !this.verifyRequestSignature(req)) {
        const violation: SecurityViolation = {
          type: 'INVALID_SIGNATURE',
          severity: 'HIGH',
          ip: clientIP,
          userAgent,
          endpoint,
          timestamp: new Date(),
          details: { reason: 'Invalid request signature' }
        };
        return { allowed: false, violation };
      }

      return { allowed: true };
    } catch (error) {
      logger.error('Security check failed:', error);
      return { allowed: true }; // Fail open for availability
    }
  }

  /**
   * Record failed authentication attempt
   */
  async recordFailedAttempt(identifier: string): Promise<boolean> {
    const key = `failed_attempts:${identifier}`;
    const attempts = await redisClient.incr(key);
    
    if (attempts === 1) {
      await redisClient.expire(key, this.options.lockoutDuration * 60);
    }

    if (attempts >= this.options.maxFailedAttempts) {
      await this.blockIdentifier(identifier);
      return true; // Account locked
    }

    return false;
  }

  /**
   * Check if identifier is currently locked out
   */
  async isIdentifierLocked(identifier: string): Promise<boolean> {
    const attempts = await redisClient.get(`failed_attempts:${identifier}`);
    return attempts ? parseInt(attempts) >= this.options.maxFailedAttempts : false;
  }

  /**
   * Clear failed attempts for identifier
   */
  async clearFailedAttempts(identifier: string): Promise<void> {
    await redisClient.del(`failed_attempts:${identifier}`);
  }

  /**
   * Block an IP address
   */
  async blockIP(ip: string, duration?: number): Promise<void> {
    this.blockedIPs.add(ip);
    const key = `blocked_ip:${ip}`;
    
    if (duration) {
      await redisClient.setex(key, duration * 60, '1');
    } else {
      await redisClient.set(key, '1');
    }

    logger.warn(`IP blocked: ${ip}`);
  }

  /**
   * Unblock an IP address
   */
  async unblockIP(ip: string): Promise<void> {
    this.blockedIPs.delete(ip);
    await redisClient.del(`blocked_ip:${ip}`);
    logger.info(`IP unblocked: ${ip}`);
  }

  /**
   * Check if IP is blocked
   */
  private async isIPBlocked(ip: string): Promise<boolean> {
    if (this.blockedIPs.has(ip)) {
      return true;
    }

    const blocked = await redisClient.get(`blocked_ip:${ip}`);
    if (blocked) {
      this.blockedIPs.add(ip);
      return true;
    }

    return false;
  }

  /**
   * Block identifier (could be IP, user ID, etc.)
   */
  private async blockIdentifier(identifier: string): Promise<void> {
    const key = `blocked_identifier:${identifier}`;
    await redisClient.setex(key, this.options.lockoutDuration * 60, '1');
    logger.warn(`Identifier blocked due to multiple failed attempts: ${identifier}`);
  }

  /**
   * Get client IP from request
   */
  private getClientIP(req: Request): string {
    return (
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection as any)?.socket?.remoteAddress ||
      '0.0.0.0'
    );
  }

  /**
   * Check if IP is whitelisted
   */
  private isIPWhitelisted(ip: string): boolean {
    return this.whitelistedIPs.has(ip);
  }

  /**
   * Check if user agent is malicious
   */
  private isMaliciousUserAgent(userAgent: string): boolean {
    return this.maliciousUserAgents.some(pattern => pattern.test(userAgent));
  }

  /**
   * Check for suspicious patterns in request
   */
  private checkSuspiciousPatterns(req: Request): string | null {
    const checkString = JSON.stringify({
      url: req.url,
      query: req.query,
      body: req.body,
      headers: req.headers
    });

    for (const pattern of this.suspiciousPatterns) {
      const match = pattern.exec(checkString);
      if (match) {
        return match[0];
      }
    }

    return null;
  }

  /**
   * Verify request signature (if signing is enabled)
   */
  private verifyRequestSignature(req: Request): boolean {
    const signature = req.get('X-Signature');
    const timestamp = req.get('X-Timestamp');
    const secretKey = process.env.REQUEST_SIGNING_SECRET;

    if (!signature || !timestamp || !secretKey) {
      return false;
    }

    // Check timestamp to prevent replay attacks
    const requestTime = parseInt(timestamp);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTime - requestTime);

    if (timeDiff > 300) { // 5 minutes tolerance
      return false;
    }

    // Verify signature
    const payload = `${req.method}${req.path}${timestamp}${JSON.stringify(req.body || {})}`;
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Record security violation
   */
  private async recordSecurityViolation(violation: SecurityViolation): Promise<void> {
    const key = `security_violation:${Date.now()}:${violation.ip}`;
    await redisClient.setex(key, 24 * 60 * 60, JSON.stringify(violation)); // Store for 24 hours
    
    logger.warn('Security violation detected:', {
      type: violation.type,
      severity: violation.severity,
      ip: violation.ip,
      endpoint: violation.endpoint,
      details: violation.details
    });

    // Auto-block for critical violations
    if (violation.severity === 'CRITICAL') {
      await this.blockIP(violation.ip, 60); // Block for 1 hour
    }
  }

  /**
   * Load blocked IPs from persistent storage
   */
  private async loadBlockedIPs(): Promise<void> {
    try {
      const keys = await redisClient.keys('blocked_ip:*');
      for (const key of keys) {
        const ip = key.replace('blocked_ip:', '');
        this.blockedIPs.add(ip);
      }
    } catch (error) {
      logger.error('Failed to load blocked IPs:', error);
    }
  }

  /**
   * Load whitelisted IPs from environment or config
   */
  private loadWhitelistedIPs(): void {
    const whitelistEnv = process.env.IP_WHITELIST;
    if (whitelistEnv) {
      const ips = whitelistEnv.split(',').map(ip => ip.trim());
      ips.forEach(ip => this.whitelistedIPs.add(ip));
    }
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash sensitive data
   */
  hashData(data: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512');
    return `${actualSalt}:${hash.toString('hex')}`;
  }

  /**
   * Verify hashed data
   */
  verifyHash(data: string, hashedData: string): boolean {
    const [salt, originalHash] = hashedData.split(':');
    const hash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512');
    return originalHash === hash.toString('hex');
  }

  /**
   * Get security violations for monitoring
   */
  async getSecurityViolations(limit: number = 100): Promise<SecurityViolation[]> {
    try {
      const keys = await redisClient.keys('security_violation:*');
      const recentKeys = keys.slice(-limit);
      const violations: SecurityViolation[] = [];

      for (const key of recentKeys) {
        const data = await redisClient.get(key);
        if (data) {
          violations.push(JSON.parse(data));
        }
      }

      return violations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      logger.error('Failed to get security violations:', error);
      return [];
    }
  }

  /**
   * Clean up expired security data
   */
  async cleanup(): Promise<void> {
    try {
      // This is handled by Redis TTL, but we can add custom cleanup logic here
      logger.info('Security cleanup completed');
    } catch (error) {
      logger.error('Security cleanup failed:', error);
    }
  }
}

// Create singleton instance
export const securityManager = new SecurityManager({
  maxFailedAttempts: parseInt(process.env.MAX_FAILED_ATTEMPTS || '5'),
  lockoutDuration: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15'),
  enableIPWhitelist: process.env.ENABLE_IP_WHITELIST === 'true',
  enableUserAgentFiltering: process.env.ENABLE_USER_AGENT_FILTERING !== 'false',
  enableRequestSigning: process.env.ENABLE_REQUEST_SIGNING === 'true'
});

// Security middleware factory
export const createSecurityMiddleware = () => {
  return async (req: any, res: any, next: any) => {
    try {
      const result = await securityManager.checkRequest(req);
      
      if (!result.allowed && result.violation) {
        return res.status(403).json({
          success: false,
          error: 'Request blocked by security policy',
          code: result.violation.type,
          timestamp: new Date().toISOString()
        });
      }

      next();
    } catch (error) {
      logger.error('Security middleware error:', error);
      next(); // Fail open
    }
  };
};

export default securityManager;