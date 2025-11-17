import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  detectLanguage,
  extractLocaleFromPathname,
  buildPathnameWithLocale,
  getAlternateLanguageUrls,
  normalizeLanguageCode,
} from '@/lib/i18n/request';

// Mock Next.js headers and cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
  })),
  headers: vi.fn(() => ({
    get: vi.fn(),
  })),
}));

vi.mock('@/lib/i18n/translations', () => ({
  languages: ['en', 'fr', 'pcm'],
  fallbackLng: 'en',
}));

describe('detectLanguage', () => {
  it('should return fallback language when no preferences found', () => {
    const language = detectLanguage();
    expect(language).toBe('en');
  });
  
  it('should detect language from pathname', () => {
    const language = detectLanguage('/fr/dashboard');
    expect(language).toBe('fr');
  });
  
  it('should return fallback for invalid locale in pathname', () => {
    const language = detectLanguage('/invalid/dashboard');
    expect(language).toBe('en');
  });
});

describe('extractLocaleFromPathname', () => {
  it('should extract locale from pathname with locale prefix', () => {
    const result = extractLocaleFromPathname('/fr/dashboard');
    
    expect(result.locale).toBe('fr');
    expect(result.pathnameWithoutLocale).toBe('/dashboard');
  });
  
  it('should return fallback locale for pathname without locale', () => {
    const result = extractLocaleFromPathname('/dashboard');
    
    expect(result.locale).toBe('en');
    expect(result.pathnameWithoutLocale).toBe('/dashboard');
  });
  
  it('should handle root path', () => {
    const result = extractLocaleFromPathname('/');
    
    expect(result.locale).toBe('en');
    expect(result.pathnameWithoutLocale).toBe('/');
  });
  
  it('should handle nested paths', () => {
    const result = extractLocaleFromPathname('/pcm/properties/123/details');
    
    expect(result.locale).toBe('pcm');
    expect(result.pathnameWithoutLocale).toBe('/properties/123/details');
  });
});

describe('buildPathnameWithLocale', () => {
  it('should add locale prefix for non-fallback language', () => {
    const path = buildPathnameWithLocale('/dashboard', 'fr');
    expect(path).toBe('/fr/dashboard');
  });
  
  it('should not add prefix for fallback language', () => {
    const path = buildPathnameWithLocale('/dashboard', 'en');
    expect(path).toBe('/dashboard');
  });
  
  it('should handle root path', () => {
    const path = buildPathnameWithLocale('/', 'fr');
    expect(path).toBe('/fr');
  });
  
  it('should replace existing locale', () => {
    const path = buildPathnameWithLocale('/en/dashboard', 'fr');
    expect(path).toBe('/fr/dashboard');
  });
  
  it('should handle empty path', () => {
    const path = buildPathnameWithLocale('', 'pcm');
    expect(path).toBe('/pcm');
  });
});

describe('getAlternateLanguageUrls', () => {
  it('should generate URLs for all languages', () => {
    const urls = getAlternateLanguageUrls('/dashboard', 'https://example.com');
    
    expect(urls).toHaveLength(3);
    expect(urls[0]).toEqual({ lang: 'en', url: 'https://example.com/dashboard' });
    expect(urls[1]).toEqual({ lang: 'fr', url: 'https://example.com/fr/dashboard' });
    expect(urls[2]).toEqual({ lang: 'pcm', url: 'https://example.com/pcm/dashboard' });