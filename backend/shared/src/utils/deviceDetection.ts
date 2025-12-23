// backend/shared/src/utils/deviceDetection.ts

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
export const parseUserAgent = (userAgent: string): DeviceInfo => {
  const ua = userAgent.toLowerCase();

  return {
    type: detectDeviceType(ua),
    os: detectOS(ua),
    osVersion: detectOSVersion(ua, userAgent),
    browser: detectBrowser(ua),
    browserVersion: detectBrowserVersion(ua, userAgent),
    isMobile: isMobileDevice(ua),
    isTablet: isTabletDevice(ua),
    isDesktop: isDesktopDevice(ua),
    isBot: isBotUserAgent(ua),
  };
};

/**
 * Detect device type
 */
const detectDeviceType = (ua: string): DeviceInfo['type'] => {
  if (isTabletDevice(ua)) return 'tablet';
  if (isMobileDevice(ua)) return 'mobile';
  if (isDesktopDevice(ua)) return 'desktop';
  return 'unknown';
};

/**
 * Check if device is mobile
 */
const isMobileDevice = (ua: string): boolean => {
  return /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua);
};

/**
 * Check if device is tablet
 */
const isTabletDevice = (ua: string): boolean => {
  return /ipad|android(?!.*mobile)|tablet|kindle|silk/i.test(ua);
};

/**
 * Check if device is desktop
 */
const isDesktopDevice = (ua: string): boolean => {
  return !isMobileDevice(ua) && !isTabletDevice(ua) && !isBotUserAgent(ua);
};

/**
 * Detect operating system
 */
const detectOS = (ua: string): string => {
  if (/windows phone/i.test(ua)) return 'Windows Phone';
  if (/android/i.test(ua)) return 'Android';
  if (/ipad|iphone|ipod/i.test(ua)) return 'iOS';
  if (/windows/i.test(ua)) return 'Windows';
  if (/mac os x/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  if (/blackberry/i.test(ua)) return 'BlackBerry';
  return 'Unknown';
};

/**
 * Detect OS version
 */
const detectOSVersion = (ua: string, originalUA: string): string | undefined => {
  let match;

  // iOS
  match = originalUA.match(/OS (\d+)[_.](\d+)/);
  if (match) return `${match[1]}.${match[2]}`;

  // Android
  match = originalUA.match(/Android (\d+\.?\d*)/);
  if (match) return match[1];

  // Windows
  match = originalUA.match(/Windows NT (\d+\.?\d*)/);
  if (match) {
    const versions: Record<string, string> = {
      '10.0': '10',
      '6.3': '8.1',
      '6.2': '8',
      '6.1': '7',
    };
    return versions[match[1]] || match[1];
  }

  // macOS
  match = originalUA.match(/Mac OS X (\d+)[_.](\d+)/);
  if (match) return `${match[1]}.${match[2]}`;

  return undefined;
};

/**
 * Detect browser
 */
const detectBrowser = (ua: string): string => {
  if (/edg/i.test(ua)) return 'Edge';
  if (/chrome|crios/i.test(ua)) return 'Chrome';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua)) return 'Safari';
  if (/opera|opr/i.test(ua)) return 'Opera';
  if (/msie|trident/i.test(ua)) return 'Internet Explorer';
  if (/samsung/i.test(ua)) return 'Samsung Internet';
  return 'Unknown';
};

/**
 * Detect browser version
 */
const detectBrowserVersion = (ua: string, originalUA: string): string | undefined => {
  let match;

  // Chrome
  match = originalUA.match(/Chrome\/(\d+\.?\d*)/);
  if (match) return match[1];

  // Firefox
  match = originalUA.match(/Firefox\/(\d+\.?\d*)/);
  if (match) return match[1];

  // Safari
  match = originalUA.match(/Version\/(\d+\.?\d*)/);
  if (match) return match[1];

  // Edge
  match = originalUA.match(/Edg\/(\d+\.?\d*)/);
  if (match) return match[1];

  return undefined;
};

/**
 * Check if user agent is a bot/crawler
 */
const isBotUserAgent = (ua: string): boolean => {
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /crawling/i,
    /google/i,
    /baidu/i,
    /bing/i,
    /yahoo/i,
    /duckduckgo/i,
    /yandex/i,
    /slurp/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /whatsapp/i,
    /telegram/i,
  ];

  return botPatterns.some((pattern) => pattern.test(ua));
};

/**
 * Generate device fingerprint for tracking
 */
export const generateDeviceFingerprint = (
  userAgent: string,
  ipAddress: string,
  acceptLanguage?: string
): string => {
  const deviceInfo = parseUserAgent(userAgent);
  const components = [
    ipAddress,
    deviceInfo.browser,
    deviceInfo.browserVersion,
    deviceInfo.os,
    deviceInfo.osVersion,
    acceptLanguage || '',
  ];

  // Simple hash (in production, use crypto.createHash)
  return Buffer.from(components.join('|')).toString('base64');
};

/**
 * Detect if request is from mobile app vs web
 */
export const isFromMobileApp = (userAgent: string, headers?: Record<string, any>): boolean => {
  // Check for custom app headers
  if (headers?.['x-app-platform']) {
    return headers['x-app-platform'] === 'mobile';
  }

  // Check user agent for app identifiers
  const ua = userAgent.toLowerCase();
  return /newcondo-mobile|newcondo-android|newcondo-ios/i.test(ua);
};

/**
 * Get readable device description
 */
export const getDeviceDescription = (deviceInfo: DeviceInfo): string => {
  const parts = [];

  if (deviceInfo.os !== 'Unknown') {
    parts.push(deviceInfo.os);
    if (deviceInfo.osVersion) {
      parts.push(deviceInfo.osVersion);
    }
  }

  if (deviceInfo.browser !== 'Unknown') {
    parts.push(deviceInfo.browser);
    if (deviceInfo.browserVersion) {
      parts.push(deviceInfo.browserVersion);
    }
  }

  if (deviceInfo.type !== 'unknown') {
    parts.push(`(${deviceInfo.type})`);
  }

  return parts.length > 0 ? parts.join(' ') : 'Unknown Device';
};

/**
 * Check if device should be blocked (security)
 */
export const shouldBlockDevice = (deviceInfo: DeviceInfo): boolean => {
  // Block known malicious bots
  if (deviceInfo.isBot) {
    const allowedBots = ['googlebot', 'bingbot'];
    return !allowedBots.some((bot) => 
      deviceInfo.browser.toLowerCase().includes(bot)
    );
  }

  // Block very old browsers (potential security risk)
  if (deviceInfo.browser === 'Internet Explorer') {
    return true;
  }

  return false;
};

/**
 * Extract screen resolution from user agent (if available)
 */
export const extractScreenResolution = (userAgent: string): { width?: number; height?: number } | null => {
  const match = userAgent.match(/(\d{3,4})x(\d{3,4})/);
  if (match) {
    return {
      width: parseInt(match[1], 10),
      height: parseInt(match[2], 10),
    };
  }
  return null;
};

/**
 * Detect if using VPN/Proxy (basic detection)
 */
export const isPotentialVPN = (headers: Record<string, any>): boolean => {
  // Check for common VPN/proxy headers
  const vpnIndicators = [
    headers['x-forwarded-for']?.split(',').length > 2,
    headers['x-proxy-id'] !== undefined,
    headers['via'] !== undefined,
    headers['x-forwarded-host'] !== undefined,
  ];

  return vpnIndicators.filter(Boolean).length >= 2;
};

/**
 * Get platform-specific share URL format
 */
export const getPlatformShareUrl = (
  deviceInfo: DeviceInfo,
  url: string,
  message: string
): string => {
  if (deviceInfo.os === 'Android' || deviceInfo.os === 'iOS') {
    // WhatsApp share
    return `whatsapp://send?text=${encodeURIComponent(message + ' ' + url)}`;
  }

  // Web WhatsApp
  return `https://web.whatsapp.com/send?text=${encodeURIComponent(message + ' ' + url)}`;
};

/**
 * Detect if user is likely using mobile data vs WiFi (based on browser hints)
 */
export const detectConnectionType = (headers: Record<string, any>): 'mobile' | 'wifi' | 'unknown' => {
  const saveData = headers['save-data'];
  const downlink = headers['downlink'];

  if (saveData === 'on') return 'mobile';
  if (downlink && parseFloat(downlink) < 1) return 'mobile';

  return 'unknown';
};

/**
 * Check if device supports modern web features
 */
export const supportsModernFeatures = (deviceInfo: DeviceInfo): boolean => {
  const oldBrowsers = ['Internet Explorer', 'Opera Mini'];
  
  if (oldBrowsers.includes(deviceInfo.browser)) {
    return false;
  }

  // Check browser version for Chrome, Firefox, Safari
  if (deviceInfo.browserVersion) {
    const version = parseFloat(deviceInfo.browserVersion);
    
    if (deviceInfo.browser === 'Chrome' && version < 90) return false;
    if (deviceInfo.browser === 'Firefox' && version < 88) return false;
    if (deviceInfo.browser === 'Safari' && version < 14) return false;
  }

  return true;
};

/**
 * Format device info for logging
 */
export const formatDeviceInfoForLog = (deviceInfo: DeviceInfo): string => {
  return JSON.stringify({
    type: deviceInfo.type,
    os: `${deviceInfo.os} ${deviceInfo.osVersion || ''}`.trim(),
    browser: `${deviceInfo.browser} ${deviceInfo.browserVersion || ''}`.trim(),
    isBot: deviceInfo.isBot,
  });
};