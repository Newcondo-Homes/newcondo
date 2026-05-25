interface DeviceInfo {
    type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
    os: string;
    osVersion?: string;
    browser: string;
    browserVersion?: string;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isBot: boolean;
}
/**
 * Parse User-Agent string to extract device information
 */
export declare const parseUserAgent: (userAgent: string) => DeviceInfo;
/**
 * Generate device fingerprint for tracking
 */
export declare const generateDeviceFingerprint: (userAgent: string, ipAddress: string, acceptLanguage?: string) => string;
/**
 * Detect if request is from mobile app vs web
 */
export declare const isFromMobileApp: (userAgent: string, headers?: Record<string, any>) => boolean;
/**
 * Get readable device description
 */
export declare const getDeviceDescription: (deviceInfo: DeviceInfo) => string;
/**
 * Check if device should be blocked (security)
 */
export declare const shouldBlockDevice: (deviceInfo: DeviceInfo) => boolean;
/**
 * Extract screen resolution from user agent (if available)
 */
export declare const extractScreenResolution: (userAgent: string) => {
    width?: number;
    height?: number;
} | null;
/**
 * Detect if using VPN/Proxy (basic detection)
 */
export declare const isPotentialVPN: (headers: Record<string, any>) => boolean;
/**
 * Get platform-specific share URL format
 */
export declare const getPlatformShareUrl: (deviceInfo: DeviceInfo, url: string, message: string) => string;
/**
 * Detect if user is likely using mobile data vs WiFi (based on browser hints)
 */
export declare const detectConnectionType: (headers: Record<string, any>) => "mobile" | "wifi" | "unknown";
/**
 * Check if device supports modern web features
 */
export declare const supportsModernFeatures: (deviceInfo: DeviceInfo) => boolean;
/**
 * Format device info for logging
 */
export declare const formatDeviceInfoForLog: (deviceInfo: DeviceInfo) => string;
export {};
//# sourceMappingURL=deviceDetection.d.ts.map