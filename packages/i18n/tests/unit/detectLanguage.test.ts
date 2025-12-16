/**
 * Language Detection Tests
 * Location: packages/i18n/tests/unit/detectLanguage.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  detectLanguage,
  detectFromBrowser,
  detectFromStorage,
  detectFromHeader,
  detectFromPath,
  getLanguageConfidence
} from '../../src/middleware/languageDetection';
import type { LanguageDetectionResult, SupportedLocale } from '../../src/types';

describe('detectLanguage', () => {
  beforeEach(() => {
    // Clear any stored language preferences
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  describe('Browser detection', () => {
    it('should detect English from browser', () => {
      Object.defineProperty(navigator, 'language', {
        value: 'en-US',
        configurable: true
      });

      const result = detectFromBrowser();
      expect(result?.locale).toBe('en');
      expect(result?.source).toBe('browser');
    });

    it('should detect French from browser', () => {
      Object.defineProperty(navigator, 'language', {
        value: 'fr-FR',
        configurable: true
      });

      const result = detectFromBrowser();
      expect(result?.locale).toBe('fr');
    });

    it('should handle browser language variants', () => {
      Object.defineProperty(navigator, 'language', {
        value: 'en-GB',
        configurable: true
      });

      const result = detectFromBrowser();
      expect(result?.locale).toBe('en');
    });

    it('should handle unsupported browser language', () => {
      Object.defineProperty(navigator, 'language', {
        value: 'de-DE',
        configurable: true
      });

      const result = detectFromBrowser();
      expect(result).toBeNull();
    });

    it('should handle multiple browser languages', () => {
      Object.defineProperty(navigator, 'languages', {
        value: ['de-DE', 'fr-FR', 'en-US'],
        configurable: true
      });

      const result = detectFromBrowser();
      expect(result?.locale).toBe('fr'); // First supported language
    });
  });

  describe('Storage detection', () => {
    it('should detect language from localStorage', () => {
      localStorage.setItem('locale', 'fr');

      const result = detectFromStorage();
      expect(result?.locale).toBe('fr');
      expect(result?.source).toBe('storage');
      expect(result?.confidence).toBeGreaterThan(0.8);
    });

    it('should detect language from sessionStorage', () => {
      sessionStorage.setItem('locale', 'en');

      const result = detectFromStorage();
      expect(result?.locale).toBe('en');
    });

    it('should prioritize localStorage over sessionStorage', () => {
      localStorage.setItem('locale', 'fr');
      sessionStorage.setItem('locale', 'en');

      const result = detectFromStorage();
      expect(result?.locale).toBe('fr');
    });

    it('should return null when no stored language', () => {
      const result = detectFromStorage();
      expect(result).toBeNull();
    });

    it('should handle invalid stored language', () => {
      localStorage.setItem('locale', 'invalid');

      const result = detectFromStorage();
      expect(result).toBeNull();
    });
  });

  describe('Header detection', () => {
    it('should detect language from Accept-Language header', () => {
      const headers = new Headers({
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
      });

      const result = detectFromHeader(headers);
      expect(result?.locale).toBe('fr');
      expect(result?.source).toBe('header');
    });

    it('should handle quality values in Accept-Language', () => {
      const headers = new Headers({
        'Accept-Language': 'en-US;q=0.5,fr-FR;q=0.9'
      });

      const result = detectFromHeader(headers);
      expect(result?.locale).toBe('fr'); // Higher quality value
    });

    it('should handle simple Accept-Language header', () => {
      const headers = new Headers({
        'Accept-Language': 'en'
      });

      const result = detectFromHeader(headers);
      expect(result?.locale).toBe('en');
    });

    it('should return null for missing header', () => {
      const headers = new Headers();
      const result = detectFromHeader(headers);
      expect(result).toBeNull();
    });

    it('should handle unsupported languages in header', () => {
      const headers = new Headers({
        'Accept-Language': 'de-DE,es-ES'
      });

      const result = detectFromHeader(headers);
      expect(result).toBeNull();
    });
  });

  describe('Path detection', () => {
    it('should detect language from URL path', () => {
      const url = 'https://example.com/fr/properties';
      const result = detectFromPath(url);
      expect(result?.locale).toBe('fr');
      expect(result?.source).toBe('path');
    });

    it('should detect language from path with query params', () => {
      const url = 'https://example.com/en/dashboard?tab=profile';
      const result = detectFromPath(url);
      expect(result?.locale).toBe('en');
    });

    it('should detect pidgin from path', () => {
      const url = 'https://example.com/pcm/home';
      const result = detectFromPath(url);
      expect(result?.locale).toBe('pcm');
    });

    it('should return null for path without language', () => {
      const url = 'https://example.com/properties';
      const result = detectFromPath(url);
      expect(result).toBeNull();
    });

    it('should return null for invalid language in path', () => {
      const url = 'https://example.com/de/properties';
      const result = detectFromPath(url);
      expect(result).toBeNull();
    });

    it('should handle root path with language', () => {
      const url = 'https://example.com/fr';
      const result = detectFromPath(url);
      expect(result?.locale).toBe('fr');
    });
  });

  describe('Combined detection with priority', () => {
    it('should prioritize stored language over browser', () => {
      localStorage.setItem('locale', 'fr');
      Object.defineProperty(navigator, 'language', {
        value: 'en-US',
        configurable: true
      });

      const result = detectLanguage({
        order: ['localStorage', 'browser']
      });

      expect(result.locale).toBe('fr');
      expect(result.source).toBe('storage');
    });

    it('should fall back to browser when storage empty', () => {
      Object.defineProperty(navigator, 'language', {
        value: 'fr-FR',
        configurable: true
      });

      const result = detectLanguage({
        order: ['localStorage', 'browser']
      });

      expect(result.locale).toBe('fr');
      expect(result.source).toBe('browser');
    });

    it('should use default locale when no detection succeeds', () => {
      const result = detectLanguage({
        order: ['localStorage', 'browser'],
        defaultLocale: 'en'
      });

      expect(result.locale).toBe('en');
      expect(result.source).toBe('default');
    });
  });

  describe('Language confidence scoring', () => {
    it('should give high confidence to user-set preference', () => {
      localStorage.setItem('locale', 'fr');
      const result = detectFromStorage();
      expect(result?.confidence).toBeGreaterThanOrEqual(0.95);
    });

    it('should give medium confidence to browser detection', () => {
      Object.defineProperty(navigator, 'language', {
        value: 'fr-FR',
        configurable: true
      });
      const result = detectFromBrowser();
      expect(result?.confidence).toBeGreaterThanOrEqual(0.7);
      expect(result?.confidence).toBeLessThan(0.95);
    });

    it('should give high confidence to path-based detection', () => {
      const result = detectFromPath('https://example.com/fr/home');
      expect(result?.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('should calculate overall confidence correctly', () => {
      const confidence = getLanguageConfidence('en', 'browser');
      expect(confidence).toBeGreaterThan(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle case-insensitive locale codes', () => {
      localStorage.setItem('locale', 'FR');
      const result = detectFromStorage();
      expect(result?.locale).toBe('fr');
    });

    it('should handle whitespace in stored locale', () => {
      localStorage.setItem('locale', ' en ');
      const result = detectFromStorage();
      expect(result?.locale).toBe('en');
    });

    it('should handle undefined navigator', () => {
      const originalNavigator = global.navigator;
      // @ts-ignore
      delete global.navigator;
      
      const result = detectFromBrowser();
      expect(result).toBeNull();
      
      global.navigator = originalNavigator;
    });

    it('should handle malformed Accept-Language header', () => {
      const headers = new Headers({
        'Accept-Language': 'invalid;;;format'
      });
      const result = detectFromHeader(headers);
      expect(result).toBeNull();
    });
  });

  describe('Nigerian-specific detection', () => {
    it('should detect Nigerian Pidgin preference', () => {
      localStorage.setItem('locale', 'pcm');
      const result = detectFromStorage();
      expect(result?.locale).toBe('pcm');
    });

    it('should fall back to English for Nigeria when Pidgin unavailable', () => {
      Object.defineProperty(navigator, 'language', {
        value: 'en-NG',
        configurable: true
      });
      const result = detectFromBrowser();
      expect(result?.locale).toBe('en');
    });
  });

  describe('Detection result structure', () => {
    it('should return complete detection result', () => {
      localStorage.setItem('locale', 'fr');
      const result = detectFromStorage();
      
      expect(result).toHaveProperty('locale');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('confidence');
      expect(result?.locale).toBe('fr');
      expect(result?.source).toBe('storage');
      expect(typeof result?.confidence).toBe('number');
    });

    it('should ensure confidence is between 0 and 1', () => {
      const result = detectLanguage({ order: ['browser'], defaultLocale: 'en' });
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });
});