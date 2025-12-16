/**
 * i18n Integration Tests
 * Location: packages/i18n/tests/integration/i18n.integration.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initI18n, I18nProvider, useTranslation, useCurrency, useLocale } from '../../src';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

describe('i18n Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('should initialize with default locale', () => {
      const i18n = initI18n({
        defaultLocale: 'en',
        supportedLocales: ['en', 'fr', 'pcm']
      });

      expect(i18n.locale).toBe('en');
      expect(i18n.isInitialized).toBe(true);
    });

    it('should initialize with custom locale', () => {
      const i18n = initI18n({
        defaultLocale: 'fr',
        supportedLocales: ['en', 'fr', 'pcm']
      });

      expect(i18n.locale).toBe('fr');
    });

    it('should detect and set locale from browser', () => {
      Object.defineProperty(navigator, 'language', {
        value: 'fr-FR',
        configurable: true
      });

      const i18n = initI18n({
        defaultLocale: 'en',
        supportedLocales: ['en', 'fr', 'pcm'],
        detection: {
          order: ['browser'],
          caches: []
        }
      });

      expect(i18n.locale).toBe('fr');
    });

    it('should persist locale choice to storage', () => {
      const i18n = initI18n({
        defaultLocale: 'en',
        supportedLocales: ['en', 'fr', 'pcm'],
        detection: {
          order: ['localStorage'],
          caches: ['localStorage']
        }
      });

      i18n.changeLanguage('fr');
      
      expect(localStorage.getItem('locale')).toBe('fr');
    });
  });

  describe('Translation Hook Integration', () => {
    it('should provide translation function via hook', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <I18nProvider locale="en" translations={{
          en: { common: { welcome: 'Welcome' } }
        }}>
          {children}
        </I18nProvider>
      );

      const { result } = renderHook(() => useTranslation(), { wrapper });

      expect(result.current.t('common.welcome')).toBe('Welcome');
    });

    it('should update translations when locale changes', () => {
      const translations = {
        en: { common: { welcome: 'Welcome' } },
        fr: { common: { welcome: 'Bienvenue' } }
      };

      let currentLocale = 'en';

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <I18nProvider locale={currentLocale} translations={translations}>
          {children}
        </I18nProvider>
      );

      const { result, rerender } = renderHook(() => useTranslation(), { wrapper });

      expect(result.current.t('common.welcome')).toBe('Welcome');

      currentLocale = 'fr';
      rerender();

      expect(result.current.t('common.welcome')).toBe('Bienvenue');
    });

    it('should handle missing translations with fallback', () => {
      const translations = {
        en: { common: { welcome: 'Welcome', extra: 'Extra' } },
        fr: { common: { welcome: 'Bienvenue' } }
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <I18nProvider 
          locale="fr" 
          fallbackLocale="en"
          translations={translations}
        >
          {children}
        </I18nProvider>
      );

      const { result } = renderHook(() => useTranslation(), { wrapper });

      expect(result.current.t('common.extra')).toBe('Extra'); // Fallback to English
    });
  });

  describe('Currency Hook Integration', () => {
    it('should format currency correctly', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <I18nProvider locale="en" currency="NGN">
          {children}
        </I18nProvider>
      );

      const { result } = renderHook(() => useCurrency(), { wrapper });

      const formatted = result.current.formatCurrency(100000);
      expect(formatted).toBe('₦100,000.00');
    });

    it('should handle currency change', () => {
      let currentCurrency = 'NGN';

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <I18nProvider locale="en" currency={currentCurrency}>
          {children}
        </I18nProvider>
      );

      const { result, rerender } = renderHook(() => useCurrency(), { wrapper });

      expect(result.current.formatCurrency(1000)).toContain('₦');

      currentCurrency = 'USD';
      rerender();

      expect(result.current.formatCurrency(1000)).toContain('$');
    });

    it('should parse currency strings', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <I18nProvider locale="en" currency="NGN">
          {children}
        </I18nProvider>
      );

      const { result } = renderHook(() => useCurrency(), { wrapper });

      const parsed = result.current.parseCurrency('₦100,000.00');
      expect(parsed).toBe(100000);
    });
  });

  describe('Locale Hook Integration', () => {
    it('should provide current locale', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <I18nProvider locale="fr">
          {children}
        </I18nProvider>
      );

      const { result } = renderHook(() => useLocale(), { wrapper });

      expect(result.current.locale).toBe('fr');
    });

    it('should allow locale switching', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <I18nProvider locale="en">
          {children}
        </I18nProvider>
      );

      const { result } = renderHook(() => useLocale(), { wrapper });

      expect(result.current.locale).toBe('en');

      act(() => {
        result.current.setLocale('fr');
      });

      expect(result.current.locale).toBe('fr');
    });

    it('should provide isRTL flag', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <I18nProvider locale="en">
          {children}
        </I18nProvider>
      );

      const { result } = renderHook(() => useLocale(), { wrapper });

      expect(result.current.isRTL).toBe(false);
    });
  });

  describe('Complete User Journey', () => {
    it('should handle complete localization flow', () => {
      // 1. Initialize
      const i18n = initI18n({
        defaultLocale: 'en',
        supportedLocales: ['en', 'fr', 'pcm']
      });

      expect(i18n.locale).toBe('en');

      // 2. Change language
      i18n.changeLanguage('fr');
      expect(i18n.locale).toBe('fr');

      // 3. Verify persistence
      expect(localStorage.getItem('locale')).toBe('fr');

      // 4. Reload and verify it persists
      const i18n2 = initI18n({
        defaultLocale: 'en',
        supportedLocales: ['en', 'fr', 'pcm'],
        detection: {
          order: ['localStorage'],
          caches: ['localStorage']
        }
      });

      expect(i18n2.locale).toBe('fr');
    });

    it('should handle property rental flow with i18n', () => {
      const translations = {
        en: {
          property: {
            title: 'Properties',
            rent: 'Rent Now',
            price: 'Price: ₦{{amount}}/month'
          }
        },
        fr: {
          property: {
            title: 'Propriétés',
            rent: 'Louer maintenant',
            price: 'Prix: {{amount}} ₦/mois'
          }
        }
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <I18nProvider locale="en" currency="NGN" translations={translations}>
          {children}
        </I18nProvider>
      );

      const { result } = renderHook(() => ({
        t: useTranslation(),
        currency: useCurrency()
      }), { wrapper });

      // English version
      expect(result.current.t.t('property.title')).toBe('Properties');
      expect(result.current.t.t('property.price', { 
        replace: { amount: result.current.currency.formatCurrency(100000) }
      })).toContain('100,000');
    });
  });

  describe('Performance', () => {
    it('should handle rapid locale changes efficiently', () => {
      const i18n = initI18n({
        defaultLocale: 'en',
        supportedLocales: ['en', 'fr', 'pcm']
      });

      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        i18n.changeLanguage(i % 2 === 0 ? 'en' : 'fr');
      }

      const end = performance.now();

      expect(end - start).toBeLessThan(100); // Should complete quickly
    });

    it('should cache translation lookups', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <I18nProvider 
          locale="en"
          translations={{
            en: { common: { test: 'Test' } }
          }}
        >
          {children}
        </I18nProvider>
      );

      const { result } = renderHook(() => useTranslation(), { wrapper });

      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        result.current.t('common.test');
      }

      const end = performance.now();

      expect(end - start).toBeLessThan(50); // Cached lookups should be very fast
    });
  });

  describe('Error Recovery', () => {
    it('should recover from corrupted locale storage', () => {
      localStorage.setItem('locale', 'invalid-locale');

      const i18n = initI18n({
        defaultLocale: 'en',
        supportedLocales: ['en', 'fr', 'pcm'],
        detection: {
          order: ['localStorage'],
          caches: ['localStorage']
        }
      });

      expect(i18n.locale).toBe('en'); // Should fall back to default
    });

    it('should handle missing translation files gracefully', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <I18nProvider 
          locale="fr"
          translations={{
            en: { common: { test: 'Test' } }
            // French translations missing
          }}
        >
          {children}
        </I18nProvider>
      );

      const { result } = renderHook(() => useTranslation(), { wrapper });

      // Should not crash, return key
      const translation = result.current.t('common.test');
      expect(translation).toBeTruthy();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle simultaneous locale changes', async () => {
      const i18n = initI18n({
        defaultLocale: 'en',
        supportedLocales: ['en', 'fr', 'pcm']
      });

      const promises = [
        i18n.changeLanguage('fr'),
        i18n.changeLanguage('pcm'),
        i18n.changeLanguage('en')
      ];

      await Promise.all(promises);

      // Should settle on a valid locale
      expect(['en', 'fr', 'pcm']).toContain(i18n.locale);
    });
  });
});