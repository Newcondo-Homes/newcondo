/**
 * Date Formatting Tests
 * Location: packages/i18n/tests/unit/formatDate.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  formatDate, 
  formatTime, 
  formatDateTime,
  formatRelativeTime,
  parseDate
} from '../../src/utils/formatDate';
import type { DateFormatOptions } from '../../src/types';

describe('formatDate', () => {
  const testDate = new Date('2024-03-15T14:30:00Z');

  describe('English locale', () => {
    it('should format date with default options', () => {
      const result = formatDate(testDate, 'en');
      expect(result).toMatch(/15\/03\/2024|3\/15\/2024/);
    });

    it('should format date with short style', () => {
      const result = formatDate(testDate, 'en', { dateStyle: 'short' });
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{2,4}/);
    });

    it('should format date with medium style', () => {
      const result = formatDate(testDate, 'en', { dateStyle: 'medium' });
      expect(result).toContain('Mar');
    });

    it('should format date with long style', () => {
      const result = formatDate(testDate, 'en', { dateStyle: 'long' });
      expect(result).toContain('March');
      expect(result).toContain('2024');
    });

    it('should format date with full style', () => {
      const result = formatDate(testDate, 'en', { dateStyle: 'full' });
      expect(result).toContain('Friday');
      expect(result).toContain('March');
    });
  });

  describe('French locale', () => {
    it('should format date in French', () => {
      const result = formatDate(testDate, 'fr');
      expect(result).toMatch(/15\/03\/2024/);
    });

    it('should format long date in French', () => {
      const result = formatDate(testDate, 'fr', { dateStyle: 'long' });
      expect(result).toContain('mars');
      expect(result).toContain('2024');
    });

    it('should format full date in French', () => {
      const result = formatDate(testDate, 'fr', { dateStyle: 'full' });
      expect(result).toContain('vendredi');
    });
  });

  describe('Nigerian Pidgin locale', () => {
    it('should format date for Pidgin (fallback to English)', () => {
      const result = formatDate(testDate, 'pcm');
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });
  });

  describe('Custom formats', () => {
    it('should format with year only', () => {
      const result = formatDate(testDate, 'en', { 
        year: 'numeric' 
      });
      expect(result).toBe('2024');
    });

    it('should format with month and year', () => {
      const result = formatDate(testDate, 'en', { 
        year: 'numeric',
        month: 'long'
      });
      expect(result).toContain('March');
      expect(result).toContain('2024');
    });

    it('should format day, month, year', () => {
      const result = formatDate(testDate, 'en', { 
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      expect(result).toMatch(/15|Mar|2024/);
    });
  });

  describe('Edge cases', () => {
    it('should handle today', () => {
      const today = new Date();
      const result = formatDate(today, 'en');
      expect(result).toBeTruthy();
    });

    it('should handle past dates', () => {
      const pastDate = new Date('1990-01-01');
      const result = formatDate(pastDate, 'en');
      expect(result).toContain('1990');
    });

    it('should handle future dates', () => {
      const futureDate = new Date('2030-12-31');
      const result = formatDate(futureDate, 'en');
      expect(result).toContain('2030');
    });

    it('should handle invalid date', () => {
      const invalidDate = new Date('invalid');
      const result = formatDate(invalidDate, 'en');
      expect(result).toBe('Invalid Date');
    });
  });
});

describe('formatTime', () => {
  const testDate = new Date('2024-03-15T14:30:45Z');

  describe('12-hour format', () => {
    it('should format time in 12-hour format', () => {
      const result = formatTime(testDate, 'en', { hour12: true });
      expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
    });

    it('should show PM for afternoon time', () => {
      const result = formatTime(testDate, 'en', { hour12: true });
      expect(result).toContain('PM');
    });
  });

  describe('24-hour format', () => {
    it('should format time in 24-hour format', () => {
      const result = formatTime(testDate, 'en', { hour12: false });
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('should use 24-hour format for French locale', () => {
      const result = formatTime(testDate, 'fr');
      expect(result).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe('Time with seconds', () => {
    it('should include seconds when specified', () => {
      const result = formatTime(testDate, 'en', { 
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
    });
  });
});

describe('formatDateTime', () => {
  const testDate = new Date('2024-03-15T14:30:00Z');

  it('should format complete date and time', () => {
    const result = formatDateTime(testDate, 'en');
    expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it('should format date and time in French', () => {
    const result = formatDateTime(testDate, 'fr');
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('should format with custom styles', () => {
    const result = formatDateTime(testDate, 'en', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatRelativeTime', () => {
  const now = new Date();

  it('should format "just now" for recent times', () => {
    const recent = new Date(now.getTime() - 30 * 1000); // 30 seconds ago
    const result = formatRelativeTime(recent, 'en');
    expect(result).toMatch(/just now|seconds ago/i);
  });

  it('should format minutes ago', () => {
    const minutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
    const result = formatRelativeTime(minutesAgo, 'en');
    expect(result).toMatch(/5 minutes ago/i);
  });

  it('should format hours ago', () => {
    const hoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
    const result = formatRelativeTime(hoursAgo, 'en');
    expect(result).toMatch(/2 hours ago/i);
  });

  it('should format days ago', () => {
    const daysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    const result = formatRelativeTime(daysAgo, 'en');
    expect(result).toMatch(/3 days ago/i);
  });

  it('should format future times', () => {
    const future = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    const result = formatRelativeTime(future, 'en');
    expect(result).toMatch(/in 2 hours/i);
  });

  it('should format in French', () => {
    const minutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const result = formatRelativeTime(minutesAgo, 'fr');
    expect(result).toMatch(/il y a 5 minutes/i);
  });

  it('should format in Nigerian Pidgin', () => {
    const minutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const result = formatRelativeTime(minutesAgo, 'pcm');
    expect(result).toMatch(/5 minutes ago/i); // Fallback to English
  });
});

describe('parseDate', () => {
  it('should parse DD/MM/YYYY format', () => {
    const result = parseDate('15/03/2024', 'DD/MM/YYYY');
    expect(result).toBeInstanceOf(Date);
    expect(result.getDate()).toBe(15);
    expect(result.getMonth()).toBe(2); // March (0-indexed)
    expect(result.getFullYear()).toBe(2024);
  });

  it('should parse MM/DD/YYYY format', () => {
    const result = parseDate('03/15/2024', 'MM/DD/YYYY');
    expect(result).toBeInstanceOf(Date);
    expect(result.getDate()).toBe(15);
    expect(result.getMonth()).toBe(2);
  });

  it('should parse YYYY-MM-DD format', () => {
    const result = parseDate('2024-03-15', 'YYYY-MM-DD');
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(2);
    expect(result.getDate()).toBe(15);
  });

  it('should handle invalid date strings', () => {
    const result = parseDate('invalid', 'DD/MM/YYYY');
    expect(isNaN(result.getTime())).toBe(true);
  });

  it('should handle empty string', () => {
    const result = parseDate('', 'DD/MM/YYYY');
    expect(isNaN(result.getTime())).toBe(true);
  });
});

describe('Timezone handling', () => {
  const testDate = new Date('2024-03-15T14:30:00Z');

  it('should format date in specific timezone', () => {
    const result = formatDateTime(testDate, 'en', {
      timeZone: 'Africa/Lagos'
    });
    expect(result).toBeTruthy();
  });

  it('should handle UTC timezone', () => {
    const result = formatDateTime(testDate, 'en', {
      timeZone: 'UTC'
    });
    expect(result).toBeTruthy();
  });
});