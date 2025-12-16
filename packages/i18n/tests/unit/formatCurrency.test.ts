/**
 * Currency Formatting Tests
 * Location: packages/i18n/tests/unit/formatCurrency.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { formatCurrency, parseCurrency } from '../../src/utils/formatCurrency';
import type { CurrencyFormatOptions, SupportedCurrency } from '../../src/types';

describe('formatCurrency', () => {
  describe('NGN (Nigerian Naira)', () => {
    it('should format basic NGN amount', () => {
      const result = formatCurrency(100000, 'NGN', 'en');
      expect(result).toBe('₦100,000.00');
    });

    it('should format NGN with custom decimals', () => {
      const result = formatCurrency(100000, 'NGN', 'en', { decimals: 0 });
      expect(result).toBe('₦100,000');
    });

    it('should format NGN without symbol', () => {
      const result = formatCurrency(100000, 'NGN', 'en', { showSymbol: false });
      expect(result).toBe('100,000.00');
    });

    it('should format NGN with code style', () => {
      const result = formatCurrency(100000, 'NGN', 'en', { style: 'code' });
      expect(result).toBe('NGN 100,000.00');
    });

    it('should format small NGN amounts', () => {
      const result = formatCurrency(50.50, 'NGN', 'en');
      expect(result).toBe('₦50.50');
    });

    it('should format large NGN amounts', () => {
      const result = formatCurrency(1000000000, 'NGN', 'en');
      expect(result).toBe('₦1,000,000,000.00');
    });

    it('should handle zero amount', () => {
      const result = formatCurrency(0, 'NGN', 'en');
      expect(result).toBe('₦0.00');
    });

    it('should handle negative amounts', () => {
      const result = formatCurrency(-5000, 'NGN', 'en');
      expect(result).toBe('-₦5,000.00');
    });
  });

  describe('USD (US Dollar)', () => {
    it('should format basic USD amount', () => {
      const result = formatCurrency(1234.56, 'USD', 'en');
      expect(result).toBe('$1,234.56');
    });

    it('should format USD in French locale', () => {
      const result = formatCurrency(1234.56, 'USD', 'fr');
      expect(result).toBe('1 234,56 $US');
    });
  });

  describe('EUR (Euro)', () => {
    it('should format basic EUR amount', () => {
      const result = formatCurrency(1234.56, 'EUR', 'en');
      expect(result).toBe('€1,234.56');
    });

    it('should format EUR in French locale', () => {
      const result = formatCurrency(1234.56, 'EUR', 'fr');
      expect(result).toBe('1 234,56 €');
    });
  });

  describe('XAF (CFA Franc)', () => {
    it('should format XAF without decimals', () => {
      const result = formatCurrency(10000, 'XAF', 'fr');
      expect(result).toBe('10 000 FCFA');
    });

    it('should round XAF to nearest whole number', () => {
      const result = formatCurrency(10000.75, 'XAF', 'fr');
      expect(result).toBe('10 001 FCFA');
    });
  });

  describe('Options handling', () => {
    it('should respect useGrouping option', () => {
      const result = formatCurrency(100000, 'NGN', 'en', { useGrouping: false });
      expect(result).toBe('₦100000.00');
    });

    it('should respect symbolPosition option', () => {
      const result = formatCurrency(1000, 'NGN', 'en', { symbolPosition: 'after' });
      expect(result).toBe('1,000.00₦');
    });

    it('should respect spaceBetween option', () => {
      const result = formatCurrency(1000, 'NGN', 'en', { 
        symbolPosition: 'before',
        spaceBetween: true 
      });
      expect(result).toBe('₦ 1,000.00');
    });

    it('should handle custom decimal places', () => {
      const result = formatCurrency(1000.12345, 'NGN', 'en', { decimals: 3 });
      expect(result).toBe('₦1,000.123');
    });
  });

  describe('Edge cases', () => {
    it('should handle very large numbers', () => {
      const result = formatCurrency(999999999999.99, 'NGN', 'en');
      expect(result).toBe('₦999,999,999,999.99');
    });

    it('should handle very small numbers', () => {
      const result = formatCurrency(0.01, 'NGN', 'en');
      expect(result).toBe('₦0.01');
    });

    it('should handle NaN gracefully', () => {
      const result = formatCurrency(NaN, 'NGN', 'en');
      expect(result).toBe('₦0.00');
    });

    it('should handle Infinity gracefully', () => {
      const result = formatCurrency(Infinity, 'NGN', 'en');
      expect(result).toBe('₦0.00');
    });

    it('should handle undefined amount', () => {
      const result = formatCurrency(undefined as any, 'NGN', 'en');
      expect(result).toBe('₦0.00');
    });
  });

  describe('Locale variations', () => {
    it('should format for Nigerian Pidgin locale', () => {
      const result = formatCurrency(50000, 'NGN', 'pcm');
      expect(result).toBe('₦50,000.00');
    });

    it('should use correct grouping for French locale', () => {
      const result = formatCurrency(1234567.89, 'EUR', 'fr');
      expect(result).toBe('1 234 567,89 €');
    });
  });
});

describe('parseCurrency', () => {
  it('should parse NGN formatted string', () => {
    const result = parseCurrency('₦100,000.00', 'NGN');
    expect(result).toBe(100000);
  });

  it('should parse USD formatted string', () => {
    const result = parseCurrency('$1,234.56', 'USD');
    expect(result).toBe(1234.56);
  });

  it('should parse string without symbols', () => {
    const result = parseCurrency('100,000.00', 'NGN');
    expect(result).toBe(100000);
  });

  it('should parse French formatted currency', () => {
    const result = parseCurrency('1 234,56 €', 'EUR');
    expect(result).toBe(1234.56);
  });

  it('should handle negative values', () => {
    const result = parseCurrency('-₦5,000.00', 'NGN');
    expect(result).toBe(-5000);
  });

  it('should handle invalid strings', () => {
    const result = parseCurrency('invalid', 'NGN');
    expect(result).toBe(0);
  });

  it('should handle empty string', () => {
    const result = parseCurrency('', 'NGN');
    expect(result).toBe(0);
  });

  it('should strip all non-numeric characters except decimal', () => {
    const result = parseCurrency('NGN 1,234.56', 'NGN');
    expect(result).toBe(1234.56);
  });
});

describe('Currency validation', () => {
  it('should validate positive amounts', () => {
    expect(formatCurrency(100, 'NGN', 'en')).toBeTruthy();
  });

  it('should validate zero', () => {
    expect(formatCurrency(0, 'NGN', 'en')).toBe('₦0.00');
  });

  it('should handle unsupported currency gracefully', () => {
    const result = formatCurrency(100, 'XXX' as SupportedCurrency, 'en');
    expect(result).toBe('100.00'); // Fallback to number formatting
  });
});