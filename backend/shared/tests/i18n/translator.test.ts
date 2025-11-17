/**
 * File: backend/shared/tests/i18n/translator.test.ts
 * Unit tests for translator utility functions
 */

import { Translator } from '../../src/utils/translator';
import { SupportedLocale } from '../../src/types/i18n.types';

describe('Translator', () => {
  let translator: Translator;

  beforeEach(() => {
    translator = new Translator('en');
  });

  describe('Basic Translation', () => {
    it('should translate simple keys', () => {
      const result = translator.translate('common.welcome');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return key when translation missing', () => {
      const result = translator.translate('nonexistent.key');
      expect(result).toBe('nonexistent.key');
    });

    it('should use default value when provided', () => {
      const defaultValue = 'Default Message';
      const result = translator.translate('nonexistent.key', { defaultValue });
      expect(result).toBe(defaultValue);
    });

    it('should translate across different namespaces', () => {
      const authResult = translator.translate('auth.login');
      const propertyResult = translator.translate('properties.title');
      const paymentResult = translator.translate('payments.success');

      expect(authResult).toBeTruthy();
      expect(propertyResult).toBeTruthy();
      expect(paymentResult).toBeTruthy();
    });
  });

  describe('Variable Interpolation', () => {
    it('should interpolate single variable', () => {
      const result = translator.translate('common.hello', {
        replace: { name: 'John' },
      });
      expect(result).toContain('John');
    });

    it('should interpolate multiple variables', () => {
      const result = translator.translate('common.propertyInfo', {
        replace: {
          title: 'Modern Apartment',
          price: '500000',
          location: 'Lagos',
        },
      });
      expect(result).toContain('Modern Apartment');
      expect(result).toContain('500000');
      expect(result).toContain('Lagos');
    });

    it('should handle numeric variables', () => {
      const result = translator.translate('common.count', {
        replace: { count: 42 },
      });
      expect(result).toContain('42');
    });

    it('should handle missing variables gracefully', () => {
      const result = translator.translate('common.hello', {
        replace: {},
      });
      expect(result).toBeTruthy();
    });
  });

  describe('Pluralization', () => {
    it('should use singular form for count=1', () => {
      const result = translator.translate('common.property', { count: 1 });
      expect(result).toMatch(/1 property/i);
    });

    it('should use plural form for count>1', () => {
      const result = translator.translate('common.property', { count: 5 });
      expect(result).toMatch(/5 properties/i);
    });

    it('should use plural form for count=0', () => {
      const result = translator.translate('common.property', { count: 0 });
      expect(result).toMatch(/0 properties/i);
    });

    it('should handle plural with variable interpolation', () => {
      const result = translator.translate('common.userCount', {
        count: 3,
        replace: { name: 'Lagos' },
      });
      expect(result).toContain('3');
      expect(result).toContain('Lagos');
    });
  });

  describe('Context Support', () => {
    it('should use context-specific translation', () => {
      const maleResult = translator.translate('common.friend', {
        context: 'male',
      });
      const femaleResult = translator.translate('common.friend', {
        context: 'female',
      });

      // Results may differ based on language
      expect(maleResult).toBeTruthy();
      expect(femaleResult).toBeTruthy();
    });

    it('should fallback when context not available', () => {
      const result = translator.translate('common.welcome', {
        context: 'nonexistent',
      });
      expect(result).toBeTruthy();
    });
  });

  describe('Locale Switching', () => {
    it('should switch locale', () => {
      translator.setLocale('fr');
      expect(translator.getLocale()).toBe('fr');
    });

    it('should translate in different locales', () => {
      const enResult = translator.translate('common.welcome');
      
      translator.setLocale('fr');
      const frResult = translator.translate('common.welcome');
      
      translator.setLocale('pcm');
      const pcmResult = translator.translate('common.welcome');

      expect(enResult).toBeTruthy();
      expect(frResult).toBeTruthy();
      expect(pcmResult).toBeTruthy();
    });

    it('should fallback to default locale when translation missing', () => {
      translator.setLocale('pcm');
      const result = translator.translate('newKey.notTranslatedYet');
      expect(result).toBeTruthy();
    });
  });

  describe('Nested Keys', () => {
    it('should resolve deeply nested keys', () => {
      const result = translator.translate('errors.validation.email.invalid');
      expect(result).toBeTruthy();
    });

    it('should handle array indices in keys', () => {
      const result = translator.translate('properties.features.0');
      expect(result).toBeTruthy();
    });
  });

  describe('Locale Detection', () => {
    it('should detect locale from various sources', () => {
      const detectedEn = Translator.detectLocale({
        acceptLanguageHeader: 'en-US,en;q=0.9',
      });
      expect(detectedEn).toBe('en');

      const detectedFr = Translator.detectLocale({
        acceptLanguageHeader: 'fr-FR,fr;q=0.9',
      });
      expect(detectedFr).toBe('fr');
    });

    it('should prioritize user preference', () => {
      const detected = Translator.detectLocale({
        acceptLanguageHeader: 'fr-FR',
        userPreference: 'pcm',
      });
      expect(detected).toBe('pcm');
    });

    it('should fallback to default for unsupported locales', () => {
      const detected = Translator.detectLocale({
        acceptLanguageHeader: 'es-ES,es;q=0.9',
      });
      expect(detected).toBe('en');
    });
  });

  describe('Translation Existence Check', () => {
    it('should check if translation exists', () => {
      const exists = translator.exists('common.welcome');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      const exists = translator.exists('nonexistent.key');
      expect(exists).toBe(false);
    });
  });

  describe('Batch Translation', () => {
    it('should translate multiple keys at once', () => {
      const keys = ['common.welcome', 'common.goodbye', 'auth.login'];
      const results = translator.translateBatch(keys);

      expect(results.length).toBe(keys.length);
      results.forEach((result) => {
        expect(result).toBeTruthy();
      });
    });

    it('should handle mix of valid and invalid keys', () => {
      const keys = ['common.welcome', 'nonexistent.key', 'auth.login'];
      const results = translator.translateBatch(keys);

      expect(results.length).toBe(keys.length);
      expect(results[0]).not.toBe(keys[0]); // Should be translated
      expect(results[1]).toBe(keys[1]); // Should return key
      expect(results[2]).not.toBe(keys[2]); // Should be translated
    });
  });

  describe('Special Characters', () => {
    it('should handle special characters in translations', () => {
      const result = translator.translate('common.currency');
      expect(result).toBeTruthy();
      // May contain ₦, $, €, etc.
    });

    it('should handle HTML entities', () => {
      const result = translator.translate('common.htmlContent');
      expect(result).toBeTruthy();
    });

    it('should handle newlines and formatting', () => {
      const result = translator.translate('common.multiline');
      expect(result).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should not throw on null or undefined keys', () => {
      expect(() => {
        translator.translate(null as any);
        translator.translate(undefined as any);
      }).not.toThrow();
    });

    it('should handle circular references', () => {
      const circularOptions: any = { replace: {} };
      circularOptions.replace.circular = circularOptions;

      expect(() => {
        translator.translate('common.welcome', circularOptions);
      }).not.toThrow();
    });

    it('should handle very long keys', () => {
      const longKey = 'a.'.repeat(100) + 'key';
      const result = translator.translate(longKey);
      expect(result).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should cache translations', () => {
      const key = 'common.welcome';
      
      const start1 = Date.now();
      translator.translate(key);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      translator.translate(key);
      const time2 = Date.now() - start2;

      // Second call should be faster or similar
      expect(time2).toBeLessThanOrEqual(time1 * 1.5);
    });

    it('should handle high volume translations', () => {
      const iterations = 1000;
      const start = Date.now();

      for (let i = 0; i < iterations; i++) {
        translator.translate('common.welcome');
      }

      const duration = Date.now() - start;
      const avgTime = duration / iterations;

      // Should be reasonably fast (less than 1ms per translation)
      expect(avgTime).toBeLessThan(1);
    });
  });

  describe('Formatting Integration', () => {
    it('should format currency in translations', () => {
      const result = translator.translate('payments.amount', {
        replace: {
          amount: translator.formatCurrency(500000, 'NGN'),
        },
      });
      expect(result).toContain('₦');
      expect(result).toContain('500,000');
    });

    it('should format dates in translations', () => {
      const date = new Date('2025-01-15');
      const result = translator.translate('common.date', {
        replace: {
          date: translator.formatDate(date),
        },
      });
      expect(result).toBeTruthy();
    });

    it('should format numbers in translations', () => {
      const result = translator.translate('common.views', {
        replace: {
          count: translator.formatNumber(1234567),
        },
      });
      expect(result).toContain('1,234,567');
    });
  });

  describe('Nigerian Pidgin Support', () => {
    beforeEach(() => {
      translator.setLocale('pcm');
    });

    it('should translate to Nigerian Pidgin', () => {
      const result = translator.translate('common.welcome');
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle Pidgin-specific expressions', () => {
      const result = translator.translate('common.greeting');
      expect(result).toBeTruthy();
    });
  });

  describe('French Support', () => {
    beforeEach(() => {
      translator.setLocale('fr');
    });

    it('should translate to French', () => {
      const result = translator.translate('common.welcome');
      expect(result).toBeTruthy();
    });

    it('should handle French pluralization', () => {
      const singular = translator.translate('common.property', { count: 1 });
      const plural = translator.translate('common.property', { count: 2 });
      expect(singular).toBeTruthy();
      expect(plural).toBeTruthy();
    });

    it('should handle French gender context', () => {
      const masculine = translator.translate('common.new', {
        context: 'masculine',
      });
      const feminine = translator.translate('common.new', {
        context: 'feminine',
      });
      expect(masculine).toBeTruthy();
      expect(feminine).toBeTruthy();
    });
  });
});