import { Request } from 'express';
import { SupportedLocale, DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@newcondo/i18n';

/**
 * Locale detection strategies
 */
export enum LocaleDetectionStrategy {
  QUERY_PARAM = 'query',
  HEADER = 'header',
  ACCEPT_LANGUAGE = 'accept-language',
  USER_PREFERENCE = 'user',
  COOKIE = 'cookie',
  SUBDOMAIN = 'subdomain',
}

/**
 * Locale detector configuration
 */
export interface LocaleDetectorConfig {
  strategies: LocaleDetectionStrategy[];
  queryParamName?: string;
  headerName?: string;
  cookieName?: string;
  userPropertyName?: string;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: LocaleDetectorConfig = {
  strategies: [
    LocaleDetectionStrategy.QUERY_PARAM,
    LocaleDetectionStrategy.HEADER,
    LocaleDetectionStrategy.USER_PREFERENCE,
    LocaleDetectionStrategy.ACCEPT_LANGUAGE,
  ],
  queryParamName: 'lang',
  headerName: 'x-locale',
  cookieName: 'locale',
  userPropertyName: 'preferredLocale',
};

/**
 * Locale detector class
 */
export class LocaleDetector {
  private config: LocaleDetectorConfig;

  constructor(config: Partial<LocaleDetectorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Detect locale from request using configured strategies
   */
  detect(req: Request): SupportedLocale {
    for (const strategy of this.config.strategies) {
      const locale = this.detectByStrategy(req, strategy);
      if (locale) {
        return locale;
      }
    }

    return DEFAULT_LOCALE;
  }

  /**
   * Detect locale using a specific strategy
   */
  private detectByStrategy(req: Request, strategy: LocaleDetectionStrategy): SupportedLocale | null {
    switch (strategy) {
      case LocaleDetectionStrategy.QUERY_PARAM:
        return this.detectFromQueryParam(req);
      case LocaleDetectionStrategy.HEADER:
        return this.detectFromHeader(req);
      case LocaleDetectionStrategy.ACCEPT_LANGUAGE:
        return this.detectFromAcceptLanguage(req);
      case LocaleDetectionStrategy.USER_PREFERENCE:
        return this.detectFromUserPreference(req);
      case LocaleDetectionStrategy.COOKIE:
        return this.detectFromCookie(req);
      case LocaleDetectionStrategy.SUBDOMAIN:
        return this.detectFromSubdomain(req);
      default:
        return null;
    }
  }

  /**
   * Detect from query parameter
   */
  private detectFromQueryParam(req: Request): SupportedLocale | null {
    const paramName = this.config.queryParamName || 'lang';
    const locale = req.query[paramName] as string;
    return this.validateLocale(locale);
  }

  /**
   * Detect from custom header
   */
  private detectFromHeader(req: Request): SupportedLocale | null {
    const headerName = (this.config.headerName || 'x-locale').toLowerCase();
    const locale = req.headers[headerName] as string;
    return this.validateLocale(locale);
  }

  /**
   * Detect from Accept-Language header
   */
  private detectFromAcceptLanguage(req: Request): SupportedLocale | null {
    const acceptLanguage = req.headers['accept-language'];
    if (!acceptLanguage) {
      return null;
    }

    const languages = acceptLanguage
      .split(',')
      .map(lang => {
        const parts = lang.split(';');
        const locale = parts[0].trim().toLowerCase();
        const quality = parts[1] ? parseFloat(parts[1].split('=')[1]) : 1.0;
        return { locale: locale.split('-')[0], quality };
      })
      .sort((a, b) => b.quality - a.quality);

    for (const { locale } of languages) {
      const validated = this.validateLocale(locale);
      if (validated) {
        return validated;
      }
    }

    return null;
  }

  /**
   * Detect from user preferences
   */
  private detectFromUserPreference(req: Request): SupportedLocale | null {
    const propertyName = this.config.userPropertyName || 'preferredLocale';
    
    if (req.user && typeof req.user === 'object' && propertyName in req.user) {
      const locale = (req.user as any)[propertyName] as string;
      return this.validateLocale(locale);
    }

    return null;
  }

  /**
   * Detect from cookie
   */
  private detectFromCookie(req: Request): SupportedLocale | null {
    const cookieName = this.config.cookieName || 'locale';
    
    if (req.cookies && req.cookies[cookieName]) {
      const locale = req.cookies[cookieName] as string;
      return this.validateLocale(locale);
    }

    return null;
  }

  /**
   * Detect from subdomain (e.g., fr.newcondo.com)
   */
  private detectFromSubdomain(req: Request): SupportedLocale | null {
    const host = req.hostname;
    const parts = host.split('.');
    
    if (parts.length > 2) {
      const subdomain = parts[0].toLowerCase();
      return this.validateLocale(subdomain);
    }

    return null;
  }

  /**
   * Validate if locale is supported
   */
  private validateLocale(locale: string | undefined | null): SupportedLocale | null {
    if (!locale) {
      return null;
    }

    const normalized = locale.toLowerCase() as SupportedLocale;
    return SUPPORTED_LOCALES.includes(normalized) ? normalized : null;
  }

  /**
   * Get all supported locales
   */
  getSupportedLocales(): readonly SupportedLocale[] {
    return SUPPORTED_LOCALES;
  }

  /**
   * Check if locale is supported
   */
  isSupported(locale: string): boolean {
    return SUPPORTED_LOCALES.includes(locale.toLowerCase() as SupportedLocale);
  }
}

/**
 * Create a locale detector instance
 */
export function createLocaleDetector(config?: Partial<LocaleDetectorConfig>): LocaleDetector {
  return new LocaleDetector(config);
}

/**
 * Quick locale detection function
 */
export function detectLocale(req: Request, config?: Partial<LocaleDetectorConfig>): SupportedLocale {
  const detector = createLocaleDetector(config);
  return detector.detect(req);
}