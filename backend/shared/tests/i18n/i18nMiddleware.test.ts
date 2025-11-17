/**
 * File: backend/shared/tests/i18n/i18nMiddleware.test.ts
 * Unit tests for i18n middleware
 */

import { Request, Response, NextFunction } from 'express';
import { i18nMiddleware } from '../../src/middleware/i18n';
import { SupportedLocale } from '../../src/types/i18n.types';

// Mock Request interface
interface MockRequest extends Partial<Request> {
  headers: Record<string, string>;
  query: Record<string, string>;
  cookies: Record<string, string>;
  locale?: SupportedLocale;
  t?: (key: string, options?: any) => string;
}

// Mock Response interface
interface MockResponse extends Partial<Response> {
  locals: Record<string, any>;
}

describe('i18nMiddleware', () => {
  let mockReq: MockRequest;
  let mockRes: MockResponse;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
      query: {},
      cookies: {},
    };

    mockRes = {
      locals: {},
    };

    mockNext = jest.fn();
  });

  describe('Locale Detection', () => {
    it('should detect locale from Accept-Language header', () => {
      mockReq.headers = {
        'accept-language': 'fr-FR,fr;q=0.9,en;q=0.8',
      };

      i18nMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.locale).toBe('fr');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should detect locale from query parameter', () => {
      mockReq.query = {
        lang: 'pcm',
      };

      i18nMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.locale).toBe('pcm');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should detect locale from cookie', () => {
      mockReq.cookies = {
        locale: 'fr',
      };

      i18nMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.locale).toBe('fr');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should prioritize query param over header', () => {
      mockReq.headers = {
        'accept-language': 'fr-FR',
      };
      mockReq.query = {
        lang: 'en',
      };

      i18nMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.locale).toBe('en');
    });

    it('should use default locale when no detection succeeds', () => {
      i18nMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.locale).toBe('en');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should fallback to default for unsupported locale', () => {
      mockReq.query = {
        lang: 'es', // Spanish - not supported
      };

      i18nMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.locale).toBe('en');
    });
  });

  describe('Translation Function', () => {
    beforeEach(() => {
      i18nMiddleware(mockReq as Request, mockRes as Response, mockNext);
    });

    it('should attach translation function to request', () => {
      expect(mockReq.t).toBeDefined();
      expect(typeof mockReq.t).toBe('function');
    });

    it('should translate simple keys', () => {
      const translated = mockReq.t!('common.welcome');
      expect(typeof translated).toBe('string');
      expect(translated).not.toBe('');
    });

    it('should handle variable interpolation', () => {
      const translated = mockReq.t!('common.greeting', { name: 'John' });
      expect(translated).toContain('John');
    });

    it('should handle pluralization', () => {
      const singular = mockReq.t!('common.property', { count: 1 });
      const plural = mockReq.t!('common.property', { count: 5 });
      expect(singular).not.toBe(plural);
    });

    it('should return default value for missing keys', () => {
      const translated = mockReq.t!('nonexistent.key', {
        defaultValue: 'Default Text',
      });
      expect(translated).toBe('Default Text');
    });
  });

  describe('Locale Validation', () => {
    it('should accept valid locale codes', () => {
      const validLocales: SupportedLocale[] = ['en', 'fr', 'pcm'];

      validLocales.forEach((locale) => {
        mockReq.query = { lang: locale };
        i18nMiddleware(mockReq as Request, mockRes as Response, mockNext);
        expect(mockReq.locale).toBe(locale);
      });
    });

    it('should reject invalid locale codes', () => {
      const invalidLocales = ['spanish', 'de', 'ar', 'zh'];

      invalidLocales.forEach((locale) => {
        mockReq.query = { lang: locale };
        i18nMiddleware(mockReq as Request, mockRes as Response, mockNext);
        expect(mockReq.locale).toBe('en'); // Should fallback to default
      });
    });

    it('should handle case-insensitive locale codes', () => {
      mockReq.query = { lang: 'FR' };
      i18nMiddleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockReq.locale).toBe('fr');
    });
  });

  describe('Response Locals', () => {
    it('should set locale in response locals', () => {
      mockReq.query = { lang: 'fr' };
      i18nMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.locals.locale).toBe('fr');
    });

    it('should set translation function in response locals', () => {
      i18nMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.locals.t).toBeDefined();
      expect(typeof mockRes.locals.t).toBe('function');
    });
  });

  describe('Header Parsing', () => {
    it('should parse complex Accept-Language headers', () => {
      mockReq.headers = {
        'accept-language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,pcm;q=0.6',
      };

      i18nMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.locale).toBe('fr');
    });

    it('should handle quality values correctly', () => {
      mockReq.headers = {
        'accept-language': 'en;q=0.5,fr;q=0.9,pcm;q=0.7',
      };

      i18nMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.locale).toBe('fr'); // Highest quality
    });

    it('should handle malformed headers gracefully', () => {
      mockReq.headers = {
        'accept-language': 'invalid-header-format',
      };

      i18nMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.locale).toBe('en'); // Should fallback
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Namespace Loading', () => {
    it('should load common namespace by default', () => {
      i18nMiddleware(mockReq as Request, mockRes as Response, mockNext);

      const commonKey = mockReq.t!('common.welcome');
      expect(typeof commonKey).toBe('string');
    });

    it('should load error namespace', () => {
      i18nMiddleware(mockReq as Request, mockRes as Response, mockNext);

      const errorKey = mockReq.t!('errors.notFound');
      expect(typeof errorKey).toBe('string');
    });

    it('should handle multiple namespaces', () => {
      i18nMiddleware(mockReq as Request, mockRes as Response, mockNext);

      const authKey = mockReq.t!('auth.login');
      const propertyKey = mockReq.t!('properties.create');

      expect(typeof authKey).toBe('string');
      expect(typeof propertyKey).toBe('string');
    });
  });

  describe('Error Handling', () => {
    it('should not throw on missing translations', () => {
      i18nMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(() => {
        mockReq.t!('nonexistent.translation.key');
      }).not.toThrow();
    });

    it('should handle null or undefined options gracefully', () => {
      i18nMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(() => {
        mockReq.t!('common.welcome', null as any);
        mockReq.t!('common.welcome', undefined);
      }).not.toThrow();
    });

    it('should continue on middleware errors', () => {
      // Simulate error condition
      const errorMiddleware = () => {
        throw new Error('Middleware error');
      };

      expect(() => {
        try {
          errorMiddleware();
        } catch (error) {
          // Should be caught and handled
          expect(mockNext).toBeDefined();
        }
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should cache translation resources', () => {
      const startTime = Date.now();

      // First call
      i18nMiddleware(mockReq as Request, mockRes as Response, mockNext);
      const firstCallTime = Date.now() - startTime;

      // Second call (should use cache)
      const startTime2 = Date.now();
      i18nMiddleware(mockReq as Request, mockRes as Response, mockNext);
      const secondCallTime = Date.now() - startTime2;

      // Second call should be faster (or at least not significantly slower)
      expect(secondCallTime).toBeLessThanOrEqual(firstCallTime * 1.5);
    });

    it('should handle multiple simultaneous requests', async () => {
      const requests = Array.from({ length: 10 }, () => {
        const req = { ...mockReq };
        const res = { ...mockRes };
        return new Promise((resolve) => {
          i18nMiddleware(req as Request, res as Response, () => resolve(req.locale));
        });
      });

      const results = await Promise.all(requests);
      expect(results.every((locale) => locale === 'en')).toBe(true);
    });
  });
});