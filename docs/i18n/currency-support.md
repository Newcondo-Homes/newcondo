# Currency Support Documentation

## Overview

The Newcondo platform supports multiple currencies to serve users across different African markets and international users. This document covers currency configuration, formatting, conversion, and best practices.

## Supported Currencies

### Primary Currencies

| Currency | Code | Symbol | Region | Decimal Places |
|----------|------|--------|--------|----------------|
| Nigerian Naira | NGN | ₦ | Nigeria | 2 |
| West African CFA Franc | XOF | CFA | Francophone West Africa | 0 |
| Ghanaian Cedi | GHS | ₵ | Ghana | 2 |
| Kenyan Shilling | KES | KSh | Kenya | 2 |
| US Dollar | USD | $ | International | 2 |
| Euro | EUR | € | International | 2 |

### Regional Coverage

```typescript
// packages/i18n/src/config/currencies.ts

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  nativeName?: string;
  symbolPosition: 'before' | 'after';
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
  subunit?: string;
  subunitToUnit: number;
  enabled: boolean;
  countries: string[];
}

export const currencies: Record<string, CurrencyConfig> = {
  NGN: {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
    nativeName: 'Naira',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    subunit: 'kobo',
    subunitToUnit: 100,
    enabled: true,
    countries: ['NG'],
  },
  XOF: {
    code: 'XOF',
    symbol: 'CFA',
    name: 'West African CFA Franc',
    nativeName: 'Franc CFA',
    symbolPosition: 'after',
    decimalPlaces: 0,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
    subunit: 'centime',
    subunitToUnit: 100,
    enabled: true,
    countries: ['BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG'],
  },
  GHS: {
    code: 'GHS',
    symbol: '₵',
    name: 'Ghanaian Cedi',
    nativeName: 'Cedi',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    subunit: 'pesewa',
    subunitToUnit: 100,
    enabled: true,
    countries: ['GH'],
  },
  KES: {
    code: 'KES',
    symbol: 'KSh',
    name: 'Kenyan Shilling',
    nativeName: 'Shilingi',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    subunit: 'cent',
    subunitToUnit: 100,
    enabled: true,
    countries: ['KE'],
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    subunit: 'cent',
    subunitToUnit: 100,
    enabled: true,
    countries: ['US'],
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
    subunit: 'cent',
    subunitToUnit: 100,
    enabled: true,
    countries: ['EU'],
  },
};
```

## Currency Formatting

### Basic Formatting

```typescript
// packages/i18n/src/utils/currency.ts

import { currencies, CurrencyConfig } from '../config/currencies';

export interface FormatCurrencyOptions {
  locale?: string;
  showSymbol?: boolean;
  showCode?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
  notation?: 'standard' | 'compact';
}

export function formatCurrency(
  amount: number,
  currencyCode: string,
  locale: string = 'en',
  options: FormatCurrencyOptions = {}
): string {
  const currency = currencies[currencyCode];
  
  if (!currency) {
    console.warn(`Currency ${currencyCode} not found, using default`);
    return `${amount}`;
  }

  const {
    showSymbol = true,
    showCode = false,
    minimumFractionDigits = currency.decimalPlaces,
    maximumFractionDigits = currency.decimalPlaces,
    useGrouping = true,
    notation = 'standard',
  } = options;

  // Use Intl.NumberFormat for locale-aware formatting
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping,
    notation,
  });

  let formatted = formatter.format(amount);

  // Custom symbol positioning for certain currencies
  if (currency.symbolPosition === 'after' && showSymbol) {
    formatted = formatted.replace(currency.symbol, '').trim();
    formatted = `${formatted} ${currency.symbol}`;
  }

  // Add currency code if requested
  if (showCode) {
    formatted = `${formatted} ${currencyCode}`;
  }

  return formatted;
}

// Examples:
formatCurrency(50000, 'NGN', 'en-NG')
// Output: "₦50,000.00"

formatCurrency(50000, 'XOF', 'fr-CI')
// Output: "50 000 CFA"

formatCurrency(1500000, 'NGN', 'en-NG', { notation: 'compact' })
// Output: "₦1.5M"
```

### Compact Notation

```typescript
export function formatCurrencyCompact(
  amount: number,
  currencyCode: string,
  locale: string = 'en'
): string {
  return formatCurrency(amount, currencyCode, locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  });
}

// Examples:
formatCurrencyCompact(1200, 'NGN', 'en')     // ₦1.2K
formatCurrencyCompact(50000, 'NGN', 'en')    // ₦50K
formatCurrencyCompact(1500000, 'NGN', 'en')  // ₦1.5M
formatCurrencyCompact(2500000000, 'NGN', 'en') // ₦2.5B
```

### Range Formatting

```typescript
export function formatCurrencyRange(
  min: number,
  max: number,
  currencyCode: string,
  locale: string = 'en'
): string {
  const minFormatted = formatCurrency(min, currencyCode, locale);
  const maxFormatted = formatCurrency(max, currencyCode, locale);
  
  return `${minFormatted} - ${maxFormatted}`;
}

// Example:
formatCurrencyRange(50000, 100000, 'NGN', 'en')
// Output: "₦50,000.00 - ₦100,000.00"
```

### Input Formatting

```typescript
export function parseCurrencyInput(
  input: string,
  currencyCode: string
): number | null {
  const currency = currencies[currencyCode];
  
  if (!currency) return null;

  // Remove currency symbol and code
  let cleaned = input
    .replace(currency.symbol, '')
    .replace(currencyCode, '')
    .trim();

  // Remove thousands separators
  cleaned = cleaned.replace(
    new RegExp(`\\${currency.thousandsSeparator}`, 'g'),
    ''
  );

  // Replace decimal separator with dot
  cleaned = cleaned.replace(currency.decimalSeparator, '.');

  // Parse to number
  const parsed = parseFloat(cleaned);

  return isNaN(parsed) ? null : parsed;
}

// Example:
parseCurrencyInput('₦50,000.00', 'NGN')  // 50000
parseCurrencyInput('50 000 CFA', 'XOF')  // 50000
```

## Currency Conversion

### Exchange Rate Integration

```typescript
// packages/i18n/src/utils/exchange.ts

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
  source: string;
}

export class CurrencyConverter {
  private rates: Map<string, ExchangeRate> = new Map();
  private updateInterval: number = 3600000; // 1 hour

  async updateRates(): Promise<void> {
    try {
      // Fetch from exchange rate API
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/USD`
      );
      const data = await response.json();

      // Store rates
      Object.entries(data.rates).forEach(([currency, rate]) => {
        const key = `USD_${currency}`;
        this.rates.set(key, {
          from: 'USD',
          to: currency as string,
          rate: rate as number,
          timestamp: new Date(data.time_last_updated * 1000),
          source: 'exchangerate-api.com',
        });
      });
    } catch (error) {
      console.error('Failed to update exchange rates:', error);
    }
  }

  convert(
    amount: number,
    from: string,
    to: string
  ): number | null {
    if (from === to) return amount;

    // Try direct conversion
    const directKey = `${from}_${to}`;
    const directRate = this.rates.get(directKey);
    if (directRate) {
      return amount * directRate.rate;
    }

    // Try conversion through USD
    const toUSD = this.rates.get(`${from}_USD`);
    const fromUSD = this.rates.get(`USD_${to}`);

    if (toUSD && fromUSD) {
      return amount * toUSD.rate * fromUSD.rate;
    }

    return null;
  }

  getRate(from: string, to: string): number | null {
    const key = `${from}_${to}`;
    return this.rates.get(key)?.rate || null;
  }
}

// Usage:
const converter = new CurrencyConverter();
await converter.updateRates();

const ngnAmount = 50000;
const usdAmount = converter.convert(ngnAmount, 'NGN', 'USD');
// Convert ₦50,000 to USD
```

### Display Converted Prices

```typescript
export function formatWithConversion(
  amount: number,
  baseCurrency: string,
  displayCurrency: string,
  locale: string
): string {
  const converter = new CurrencyConverter();
  const converted = converter.convert(amount, baseCurrency, displayCurrency);

  if (!converted) {
    return formatCurrency(amount, baseCurrency, locale);
  }

  const baseFormatted = formatCurrency(amount, baseCurrency, locale);
  const convertedFormatted = formatCurrency(converted, displayCurrency, locale);

  return `${baseFormatted} (≈${convertedFormatted})`;
}

// Example:
formatWithConversion(50000, 'NGN', 'USD', 'en')
// Output: "₦50,000.00 (≈$67.50)"
```

## React Components

### Currency Display Component

```typescript
// packages/ui/src/components/CurrencyDisplay.tsx

import { formatCurrency } from '@newcondo/i18n/utils';
import { useTranslation } from '@newcondo/i18n';

interface CurrencyDisplayProps {
  amount: number;
  currency: string;
  locale?: string;
  compact?: boolean;
  showConversion?: boolean;
  targetCurrency?: string;
}

export function CurrencyDisplay({
  amount,
  currency,
  locale,
  compact = false,
  showConversion = false,
  targetCurrency,
}: CurrencyDisplayProps) {
  const { i18n } = useTranslation();
  const currentLocale = locale || i18n.language;

  const formatted = formatCurrency(
    amount,
    currency,
    currentLocale,
    { notation: compact ? 'compact' : 'standard' }
  );

  return (
    <span className="font-medium text-primary">
      {formatted}
      {showConversion && targetCurrency && (
        <span className="ml-2 text-sm text-muted-foreground">
          {/* Add conversion display */}
        </span>
      )}
    </span>
  );
}
```

### Currency Input Component

```typescript
// packages/ui/src/components/CurrencyInput.tsx

import { Input } from '@newcondo/ui';
import { useState, useEffect } from 'react';
import { formatCurrency, parseCurrencyInput } from '@newcondo/i18n/utils';

interface CurrencyInputProps {
  value: number;
  currency: string;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CurrencyInput({
  value,
  currency,
  onChange,
  placeholder,
  disabled,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value) {
      setDisplayValue(formatCurrency(value, currency, 'en'));
    }
  }, [value, currency]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setDisplayValue(input);

    const parsed = parseCurrencyInput(input, currency);
    if (parsed !== null) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    if (value) {
      setDisplayValue(formatCurrency(value, currency, 'en'));
    }
  };

  return (
    <Input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}
```

### Currency Selector

```typescript
// packages/ui/src/components/CurrencySelector.tsx

import { Select } from '@newcondo/ui';
import { currencies } from '@newcondo/i18n/config';

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: string) => void;
  allowedCurrencies?: string[];
}

export function CurrencySelector({
  value,
  onChange,
  allowedCurrencies,
}: CurrencySelectorProps) {
  const availableCurrencies = allowedCurrencies
    ? Object.entries(currencies).filter(([code]) =>
        allowedCurrencies.includes(code)
      )
    : Object.entries(currencies).filter(([, config]) => config.enabled);

  return (
    <Select value={value} onValueChange={onChange}>
      {availableCurrencies.map(([code, config]) => (
        <SelectItem key={code} value={code}>
          <div className="flex items-center gap-2">
            <span>{config.symbol}</span>
            <span>{code}</span>
            <span className="text-muted-foreground text-sm">
              - {config.name}
            </span>
          </div>
        </SelectItem>
      ))}
    </Select>
  );
}
```

## Backend Integration

### Currency in Database

```typescript
// Store amounts in smallest unit (kobo, pesewas, etc.)
// This prevents floating-point issues

interface PropertyPrice {
  amount: number; // Amount in smallest unit
  currency: string; // Currency code
}

// Conversion helpers
export function toSmallestUnit(amount: number, currency: string): number {
  const config = currencies[currency];
  return Math.round(amount * config.subunitToUnit);
}

export function fromSmallestUnit(amount: number, currency: string): number {
  const config = currencies[currency];
  return amount / config.subunitToUnit;
}

// Example:
const rentNGN = 50000; // ₦50,000
const rentInKobo = toSmallestUnit(rentNGN, 'NGN'); // 5,000,000 kobo

// Store in database
await prisma.property.create({
  data: {
    title: 'Nice Apartment',
    price: rentInKobo,
    currency: 'NGN',
  },
});

// Retrieve and display
const property = await prisma.property.findUnique({ where: { id } });
const displayAmount = fromSmallestUnit(property.price, property.currency);
// 50000
```

### Payment Processing

```typescript
// backend/payment-service/src/services/currencyService.ts

export class PaymentCurrencyService {
  async convertForPayment(
    amount: number,
    from: string,
    to: string
  ): Promise<{ amount: number; rate: number }> {
    const converter = new CurrencyConverter();
    await converter.updateRates();

    const converted = converter.convert(amount, from, to);
    const rate = converter.getRate(from, to);

    if (!converted || !rate) {
      throw new Error(`Cannot convert ${from} to ${to}`);
    }

    return { amount: converted, rate };
  }

  async processMultiCurrencyPayment(
    propertyPrice: number,
    propertyCurrency: string,
    paymentCurrency: string
  ): Promise<PaymentDetails> {
    // Convert if needed
    let finalAmount = propertyPrice;
    let exchangeRate = 1;

    if (propertyCurrency !== paymentCurrency) {
      const conversion = await this.convertForPayment(
        propertyPrice,
        propertyCurrency,
        paymentCurrency
      );
      finalAmount = conversion.amount;
      exchangeRate = conversion.rate;
    }

    return {
      originalAmount: propertyPrice,
      originalCurrency: propertyCurrency,
      paymentAmount: finalAmount,
      paymentCurrency: paymentCurrency,
      exchangeRate,
    };
  }
}
```

## Best Practices

### 1. Always Store Currency Code

```typescript
// ✅ Good - Store currency with amount
{
  rent: 50000,
  currency: 'NGN'
}

// ❌ Bad - Amount without currency
{
  rent: 50000
}
```

### 2. Use Smallest Unit in Database

```typescript
// ✅ Good - Store in kobo/pesewas
{
  price: 5000000, // 50,000 NGN in kobo
  currency: 'NGN'
}

// ❌ Bad - Floating point in database
{
  price: 50000.50,
  currency: 'NGN'
}
```

### 3. Format for Display Only

```typescript
// ✅ Good - Format when displaying
const displayPrice = formatCurrency(property.price, property.currency);

// ❌ Bad - Store formatted string
{
  price: '₦50,000.00' // Wrong!
}
```

### 4. Handle Multi-Currency Transactions

```typescript
// Always record exchange rate used
{
  originalAmount: 50000,
  originalCurrency: 'NGN',
  paidAmount: 67.50,
  paidCurrency: 'USD',
  exchangeRate: 0.00135,
  exchangeRateSource: 'exchangerate-api.com',
  exchangeRateTimestamp: '2025-11-12T10:30:00Z'
}
```

### 5. Validate Currency Inputs

```typescript
export function validateCurrency(currency: string): boolean {
  return currency in currencies && currencies[currency].enabled;
}

export function validateAmount(amount: number, currency: string): boolean {
  if (amount <= 0) return false;
  
  const config = currencies[currency];
  if (!config) return false;

  // Check decimal places
  const decimals = amount.toString().split('.')[1]?.length || 0;
  return decimals <= config.decimalPlaces;
}
```

## Testing

```typescript
// packages/i18n/tests/currency.test.ts

describe('Currency Formatting', () => {
  test('formats NGN correctly', () => {
    expect(formatCurrency(50000, 'NGN', 'en')).toBe('₦50,000.00');
  });

  test('formats XOF without decimals', () => {
    expect(formatCurrency(50000, 'XOF', 'fr')).toBe('50 000 CFA');
  });

  test('handles compact notation', () => {
    expect(
      formatCurrency(1500000, 'NGN', 'en', { notation: 'compact' })
    ).toBe('₦1.5M');
  });

  test('parses currency input', () => {
    expect(parseCurrencyInput('₦50,000.00', 'NGN')).toBe(50000);
    expect(parseCurrencyInput('50 000 CFA', 'XOF')).toBe(50000);
  });
});
```

## Troubleshooting

### Issue: Currency Symbol Not Displaying
- Check font supports currency symbols
- Use fallback: `{symbol || code}`
- Verify Unicode encoding

### Issue: Incorrect Formatting
- Verify locale parameter
- Check currency configuration
- Update Intl polyfill if needed

### Issue: Conversion Errors
- Check exchange rate API availability
- Implement rate caching
- Provide manual fallback rates

## Resources

- [ISO 4217 Currency Codes](https://www.iso.org/iso-4217-currency-codes.html)
- [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
- [Exchange Rate APIs](https://exchangerate-api.com/)
- West African Currencies: [BCEAO](https://www.bceao.int/)

## Support

For currency-related questions:
- Email: currency@newcondo.com
- Slack: #i18n-currency