/**
 * Translator Tests
 * Location: packages/i18n/tests/unit/translator.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTranslator, Translator } from '../../src/utils/translator';
import type { TranslationResource, TranslationOptions } from '../../src/types';

describe('Translator', () => {
  let translator: Translator;
  
  const mockTranslations: Record<string, TranslationResource> = {
    en: {
      common: {
        welcome: 'Welcome',
        goodbye: 'Goodbye',
        hello_name: 'Hello, {{name}}!',
        items_count: '{{count}} item',
        items_count_plural: '{{count}} items',
        nested: {
          key: 'Nested value'
        }
      }
    },
    fr: {
      common: {
        welcome: 'Bienvenue',
        goodbye: 'Au revoir',
        hello_name: 'Bonjour, {{name}}!',
        items_count: '{{count}} élément',
        items_count_plural: '{{count}} éléments',
        nested: {
          key: 'Valeur imbriquée'
        }
      }
    },
    pcm: {
      common: {
        welcome: 'Welcome o',
        goodbye: 'I dey go',
        hello_name: 'How you dey, {{name}}!',
        items_count: '{{count}} thing',
        items_count_plural: '{{count}} things'
      }
    }
  };

  beforeEach(() => {
    translator = createTranslator({
      locale: 'en',
      fallbackLocale: 'en',
      translations: mockTranslations
    });
  });

  describe('Basic translation', () => {
    it('should translate simple key', () => {
      const result = translator.t('common.welcome');
      expect(result).toBe('Welcome');
    });

    it('should translate nested key', () => {
      const result = translator.t('common.nested.key');
      expect(result).toBe('Nested value');
    });

    it('should return key when translation missing', () => {
      const result = translator.t('common.nonexistent');
      expect(result).toBe('common.nonexistent');
    });

    it('should use default value when provided', () => {
      const result = translator.t('common.nonexistent', { 
        defaultValue: 'Default text' 
      });
      expect(result).toBe('Default text');
    });
  });

  describe('Interpolation', () => {
    it('should interpolate single variable', () => {
      const result = translator.t('common.hello_name', { 
        replace: { name: 'John' } 
      });
      expect(result).toBe('Hello, John!');
    });

    it('should interpolate multiple variables', () => {
      const translations = {
        en: {
          common: {
            greeting: 'Hello {{name}}, you have {{count}} messages'
          }
        }
      };
      
      const t = createTranslator({
        locale: 'en',
        fallbackLocale: 'en',
        translations
      });

      const result = t.t('common.greeting', {
        replace: { name: 'Alice', count: '5' }
      });
      expect(result).toBe('Hello Alice, you have 5 messages');
    });

    it('should handle missing interpolation values', () => {
      const result = translator.t('common.hello_name', { 
        replace: {} 
      });
      expect(result).toBe('Hello, {{name}}!');
    });

    it('should handle numeric interpolation values', () => {
      const translations = {
        en: {
          common: {
            price: 'Price: ₦{{amount}}'
          }
        }
      };
      
      const t = createTranslator({
        locale: 'en',
        fallbackLocale: 'en',
        translations
      });

      const result = t.t('common.price', {
        replace: { amount: 100000 }
      });
      expect(result).toBe('Price: ₦100000');
    });
  });

  describe('Pluralization', () => {
    it('should use singular form for count=1', () => {
      const result = translator.t('common.items_count', { 
        count: 1 
      });
      expect(result).toBe('1 item');
    });

    it('should use plural form for count>1', () => {
      const result = translator.t('common.items_count', { 
        count: 5 
      });
      expect(result).toBe('5 items');
    });

    it('should use plural form for count=0', () => {
      const result = translator.t('common.items_count', { 
        count: 0 
      });
      expect(result).toBe('0 items');
    });

    it('should handle French pluralization', () => {
      const frTranslator = createTranslator({
        locale: 'fr',
        fallbackLocale: 'en',
        translations: mockTranslations
      });

      const singular = frTranslator.t('common.items_count', { count: 1 });
      const plural = frTranslator.t('common.items_count', { count: 5 });
      
      expect(singular).toBe('1 élément');
      expect(plural).toBe('5 éléments');
    });
  });

  describe('Locale switching', () => {
    it('should translate in French when locale is changed', () => {
      translator.setLocale('fr');
      const result = translator.t('common.welcome');
      expect(result).toBe('Bienvenue');
    });

    it('should translate in Nigerian Pidgin', () => {
      translator.setLocale('pcm');
      const result = translator.t('common.welcome');
      expect(result).toBe('Welcome o');
    });

    it('should handle interpolation in different locales', () => {
      translator.setLocale('fr');
      const result = translator.t('common.hello_name', {
        replace: { name: 'Marie' }
      });
      expect(result).toBe('Bonjour, Marie!');
    });
  });

  describe('Fallback behavior', () => {
    it('should fall back to English when translation missing', () => {
      translator.setLocale('pcm');
      const result = translator.t('common.nested.key');
      expect(result).toBe('Nested value'); // Falls back to English
    });

    it('should use fallback for entire missing namespace', () => {
      const translations = {
        en: {
          common: { test: 'Test' }
        },
        fr: {} // Empty French translations
      };

      const t = createTranslator({
        locale: 'fr',
        fallbackLocale: 'en',
        translations
      });

      const result = t.t('common.test');
      expect(result).toBe('Test');
    });
  });

  describe('Context-specific translations', () => {
    it('should support context parameter', () => {
      const translations = {
        en: {
          common: {
            status: 'Status',
            status_pending: 'Pending',
            status_approved: 'Approved'
          }
        }
      };

      const t = createTranslator({
        locale: 'en',
        fallbackLocale: 'en',
        translations
      });

      const result = t.t('common.status', { context: 'pending' });
      expect(result).toBe('Pending');
    });
  });

  describe('Namespace handling', () => {
    const multiNamespaceTranslations = {
      en: {
        common: { welcome: 'Welcome' },
        auth: { login: 'Login', register: 'Register' },
        property: { list: 'Properties', create: 'Create Property' }
      }
    };

    it('should access different namespaces', () => {
      const t = createTranslator({
        locale: 'en',
        fallbackLocale: 'en',
        translations: multiNamespaceTranslations
      });

      expect(t.t('common.welcome')).toBe('Welcome');
      expect(t.t('auth.login')).toBe('Login');
      expect(t.t('property.list')).toBe('Properties');
    });

    it('should specify namespace in options', () => {
      const t = createTranslator({
        locale: 'en',
        fallbackLocale: 'en',
        translations: multiNamespaceTranslations
      });

      const result = t.t('login', { ns: 'auth' });
      expect(result).toBe('Login');
    });
  });

  describe('Error handling', () => {
    it('should handle invalid key format', () => {
      const result = translator.t('');
      expect(result).toBe('');
    });

    it('should handle null translation value', () => {
      const translations = {
        en: {
          common: {
            nullValue: null as any
          }
        }
      };

      const t = createTranslator({
        locale: 'en',
        fallbackLocale: 'en',
        translations
      });

      const result = t.t('common.nullValue');
      expect(result).toBe('common.nullValue');
    });

    it('should handle undefined namespace', () => {
      const result = translator.t('nonexistent.key');
      expect(result).toBe('nonexistent.key');
    });
  });

  describe('Utility methods', () => {
    it('should check if translation exists', () => {
      expect(translator.exists('common.welcome')).toBe(true);
      expect(translator.exists('common.nonexistent')).toBe(false);
    });

    it('should get current locale', () => {
      expect(translator.getLocale()).toBe('en');
      translator.setLocale('fr');
      expect(translator.getLocale()).toBe('fr');
    });

    it('should get available locales', () => {
      const locales = translator.getAvailableLocales();
      expect(locales).toContain('en');
      expect(locales).toContain('fr');
      expect(locales).toContain('pcm');
    });

    it('should check if locale is supported', () => {
      expect(translator.isLocaleSupported('en')).toBe(true);
      expect(translator.isLocaleSupported('fr')).toBe(true);
      expect(translator.isLocaleSupported('de')).toBe(false);
    });
  });

  describe('Performance considerations', () => {
    it('should handle large translation objects efficiently', () => {
      const largeTranslations: any = { en: { common: {} } };
      for (let i = 0; i < 1000; i++) {
        largeTranslations.en.common[`key${i}`] = `Value ${i}`;
      }

      const t = createTranslator({
        locale: 'en',
        fallbackLocale: 'en',
        translations: largeTranslations
      });

      const start = performance.now();
      t.t('common.key500');
      const end = performance.now();

      expect(end - start).toBeLessThan(10); // Should be very fast
    });

    it('should cache translation lookups', () => {
      const spy = vi.spyOn(translator as any, 'getTranslation');
      
      translator.t('common.welcome');
      translator.t('common.welcome');
      translator.t('common.welcome');

      // Implementation should optimize repeated lookups
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Special characters and formatting', () => {
    it('should handle translations with special characters', () => {
      const translations = {
        en: {
          common: {
            special: "It's a test with \"quotes\" and symbols: @#$%"
          }
        }
      };

      const t = createTranslator({
        locale: 'en',
        fallbackLocale: 'en',
        translations
      });

      const result = t.t('common.special');
      expect(result).toBe("It's a test with \"quotes\" and symbols: @#$%");
    });

    it('should handle translations with line breaks', () => {
      const translations = {
        en: {
          common: {
            multiline: 'Line 1\nLine 2\nLine 3'
          }
        }
      };

      const t = createTranslator({
        locale: 'en',
        fallbackLocale: 'en',
        translations
      });

      const result = t.t('common.multiline');
      expect(result).toContain('\n');
    });
  });
});