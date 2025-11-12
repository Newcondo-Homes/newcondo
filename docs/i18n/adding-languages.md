# Adding New Languages

## Overview

This guide walks through the process of adding a new language to the Newcondo platform.

## Prerequisites

Before adding a new language:

1. **Market Research**: Confirm there's demand for the language
2. **Resource Availability**: Ensure you have native speakers for translation
3. **Technical Requirements**: Verify language support in dependencies
4. **Legal Compliance**: Check regional regulations and requirements

## Step-by-Step Process

### Step 1: Language Configuration

#### 1.1 Add Language to Configuration

```typescript
// packages/i18n/src/config/languages.ts

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  flag: string;
  enabled: boolean;
  fallback?: string;
  region?: string;
}

export const supportedLanguages: LanguageConfig[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    flag: '🇬🇧',
    enabled: true,
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    flag: '🇫🇷',
    enabled: true,
    region: 'West Africa',
  },
  {
    code: 'pcm',
    name: 'Nigerian Pidgin',
    nativeName: 'Naijá',
    direction: 'ltr',
    flag: '🇳🇬',
    enabled: true,
    region: 'Nigeria',
  },
  // Add new language here
  {
    code: 'yo', // Yoruba example
    name: 'Yoruba',
    nativeName: 'Yorùbá',
    direction: 'ltr',
    flag: '🇳🇬',
    enabled: true,
    region: 'Nigeria',
    fallback: 'en',
  },
];

export function getLanguageByCode(code: string): LanguageConfig | undefined {
  return supportedLanguages.find((lang) => lang.code === code);
}

export function getEnabledLanguages(): LanguageConfig[] {
  return supportedLanguages.filter((lang) => lang.enabled);
}
```

#### 1.2 Update Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPPORTED_LOCALES=en,fr,pcm,yo
```

### Step 2: Create Translation Files

#### 2.1 Create Directory Structure

```bash
mkdir -p packages/i18n/src/locales/yo
```

#### 2.2 Copy Base Translation Files

```bash
# Copy English templates
cp -r packages/i18n/src/locales/en/* packages/i18n/src/locales/yo/
```

#### 2.3 Create All Required Namespaces

```bash
packages/i18n/src/locales/yo/
├── common.json
├── auth.json
├── property.json
├── payment.json
├── admin.json
├── marking.json
├── referral.json
├── errors.json
├── validation.json
├── email.json
└── sms.json
```

### Step 3: Translation Process

#### 3.1 Start with High-Priority Files

Translate in this order:
1. `common.json` - Core UI elements
2. `auth.json` - Authentication flows
3. `errors.json` - Error messages
4. `validation.json` - Form validation
5. `property.json` - Property features
6. Others as needed

#### 3.2 Translation Guidelines

**Example: Yoruba Translation**

```json
// packages/i18n/src/locales/yo/auth.json
{
  "login": {
    "title": "Wọle",
    "email": "Imeeli",
    "password": "Ọrọ Aṣiri",
    "submit": "Wọle",
    "forgotPassword": "Ṣe o gbagbe ọrọ aṣiri rẹ?",
    "noAccount": "Ko ni akọọlẹ?",
    "signUp": "Forukọsilẹ"
  },
  "register": {
    "title": "Ṣẹda Akọọlẹ",
    "userType": "Mo jẹ",
    "userTypes": {
      "owner": "Onile",
      "agent": "Aṣoju",
      "renter": "Alabara"
    }
  }
}
```

#### 3.3 Handle Pluralization

Different languages have different plural rules. Consult [CLDR](https://cldr.unicode.org/) for rules.

```json
// English (2 forms: one, other)
{
  "property_one": "{{count}} property",
  "property_other": "{{count}} properties"
}

// French (2 forms: one, other)
{
  "property_one": "{{count}} propriété",
  "property_other": "{{count}} propriétés"
}

// Yoruba (typically doesn't change for plurals)
{
  "property_one": "ile {{count}}",
  "property_other": "ile {{count}}"
}

// Arabic (6 forms: zero, one, two, few, many, other)
{
  "property_zero": "لا توجد عقارات",
  "property_one": "عقار واحد",
  "property_two": "عقاران",
  "property_few": "{{count}} عقارات",
  "property_many": "{{count}} عقارًا",
  "property_other": "{{count}} عقار"
}
```

### Step 4: Configure i18n

#### 4.1 Update i18n Configuration

```typescript
// packages/i18n/src/config/i18n.config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import new language translations
import yoCommon from '../locales/yo/common.json';
import yoAuth from '../locales/yo/auth.json';
// ... other namespaces

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { /* ... */ },
      fr: { /* ... */ },
      pcm: { /* ... */ },
      yo: {
        common: yoCommon,
        auth: yoAuth,
        // ... other namespaces
      },
    },
    // ... rest of config
  });
```

#### 4.2 Configure Pluralization Rules

```typescript
// packages/i18n/src/config/pluralization.ts
import { PluralRule } from 'i18next';

export const pluralRules: Record<string, PluralRule> = {
  en: (n) => (n === 1 ? 0 : 1),
  fr: (n) => (n > 1 ? 1 : 0),
  yo: () => 0, // Yoruba typically doesn't pluralize
  ar: (n) => {
    // Arabic has 6 plural forms
    if (n === 0) return 0;
    if (n === 1) return 1;
    if (n === 2) return 2;
    if (n % 100 >= 3 && n % 100 <= 10) return 3;
    if (n % 100 >= 11) return 4;
    return 5;
  },
};

// Apply in i18n config
i18n.init({
  // ...
  pluralSeparator: '_',
  // ...
});
```

### Step 5: Regional Settings

#### 5.1 Configure Regional Settings

```typescript
// packages/i18n/src/config/regions.ts

export interface RegionalSettings {
  locale: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  firstDayOfWeek: number; // 0 = Sunday, 1 = Monday
  phoneFormat: string;
  addressFormat: string[];
  measurementSystem: 'metric' | 'imperial';
}

export const regionalSettings: Record<string, RegionalSettings> = {
  'en-NG': {
    locale: 'en-NG',
    currency: 'NGN',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    firstDayOfWeek: 1,
    phoneFormat: '+234 XXX XXX XXXX',
    addressFormat: ['house', 'street', 'lga', 'state'],
    measurementSystem: 'metric',
  },
  'yo-NG': {
    locale: 'yo-NG',
    currency: 'NGN',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    firstDayOfWeek: 1,
    phoneFormat: '+234 XXX XXX XXXX',
    addressFormat: ['house', 'street', 'lga', 'state'],
    measurementSystem: 'metric',
  },
  'fr-CI': {
    locale: 'fr-CI',
    currency: 'XOF',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    firstDayOfWeek: 1,
    phoneFormat: '+225 XX XX XX XX XX',
    addressFormat: ['number', 'street', 'commune', 'city'],
    measurementSystem: 'metric',
  },
};
```

#### 5.2 Configure Currency Support

```typescript
// packages/i18n/src/config/currencies.ts

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  symbolPosition: 'before' | 'after';
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
}

export const currencies: Record<string, CurrencyConfig> = {
  NGN: {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  // Add currency for new region
  XOF: {
    code: 'XOF',
    symbol: 'CFA',
    name: 'West African CFA Franc',
    symbolPosition: 'after',
    decimalPlaces: 0,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
  },
};
```

### Step 6: Update UI Components

#### 6.1 Update Language Switcher

```typescript
// apps/platform/components/shared/LanguageSwitcher.tsx
import { useTranslation } from '@newcondo/i18n';
import { getEnabledLanguages } from '@newcondo/i18n/config';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const languages = getEnabledLanguages();

  return (
    <Select
      value={i18n.language}
      onValueChange={(lang) => i18n.changeLanguage(lang)}
    >
      {languages.map((lang) => (
        <SelectItem key={lang.code} value={lang.code}>
          <span className="mr-2">{lang.flag}</span>
          {lang.nativeName}
        </SelectItem>
      ))}
    </Select>
  );
}
```

### Step 7: RTL Support (if applicable)

#### 7.1 Configure RTL

```typescript
// packages/i18n/src/utils/rtl.ts

export function isRTL(locale: string): boolean {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(locale.split('-')[0]);
}

export function getDirection(locale: string): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}
```

#### 7.2 Update Layout

```typescript
// apps/platform/app/layout.tsx
import { getDirection } from '@newcondo/i18n/utils';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = detectUserLocale();
  const direction = getDirection(locale);

  return (
    <html lang={locale} dir={direction}>
      <body>{children}</body>
    </html>
  );
}
```

### Step 8: Backend Integration

#### 8.1 Email Templates

```typescript
// backend/notification-service/src/templates/yo/verification.html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Jẹrisi Akọọlẹ Rẹ</title>
</head>
<body>
  <h1>Kaabo si Newcondo!</h1>
  <p>Koodu ijẹrisi rẹ ni: <strong>{{code}}</strong></p>
  <p>Koodu yii yoo pari ni iṣẹju {{expiresIn}}.</p>
</body>
</html>
```

#### 8.2 SMS Templates

```json
// backend/notification-service/src/templates/yo/sms.json
{
  "verification": "Koodu ijẹrisi Newcondo rẹ ni: {{code}}. O yoo pari ni iṣẹju {{expiresIn}}.",
  "paymentSuccess": "Isanwo rẹ ti ṣaṣeyọri. Koodu itọkasi: {{reference}}",
  "markingAssigned": "Iṣẹ aami ile ti wa ni fun ọ. Wo abẹ app fun awọn alaye."
}
```

### Step 9: Testing

#### 9.1 Create Test Suite

```typescript
// packages/i18n/tests/yo.test.ts
import i18n from '../src/config/i18n.config';

describe('Yoruba Translations', () => {
  beforeAll(() => {
    i18n.changeLanguage('yo');
  });

  test('translates common phrases', () => {
    expect(i18n.t('common:welcome')).toBe('Kaabo');
    expect(i18n.t('common:save')).toBe('Fi pamọ');
  });

  test('handles pluralization', () => {
    expect(i18n.t('common:property', { count: 1 })).toBe('ile 1');
    expect(i18n.t('common:property', { count: 5 })).toBe('ile 5');
  });

  test('interpolates variables', () => {
    const greeting = i18n.t('common:greeting', { name: 'Adebayo' });
    expect(greeting).toBe('Kaabo, Adebayo!');
  });
});
```

#### 9.2 Manual Testing Checklist

- [ ] All UI text displays correctly
- [ ] No English fallbacks for complete translations
- [ ] Currency formatting correct for region
- [ ] Date/time formatting appropriate
- [ ] Numbers formatted correctly
- [ ] Forms validate properly
- [ ] Error messages clear
- [ ] Email templates render correctly
- [ ] SMS messages within character limits
- [ ] No text overflow in UI
- [ ] Language switcher works
- [ ] Language persists across sessions

### Step 10: Validation

#### 10.1 Run Validation Scripts

```bash
# Check for missing translations
pnpm run i18n:validate

# Generate types
pnpm run i18n:generate-types

# Run translation tests
pnpm test:i18n

# Check coverage
pnpm run i18n:coverage
```

#### 10.2 Quality Assurance

- **Native Speaker Review**: Have native speakers review all translations
- **Cultural Appropriateness**: Ensure content is culturally appropriate
- **Consistency Check**: Verify consistent terminology
- **Legal Review**: Check legal/compliance translations
- **User Testing**: Conduct UAT with native speakers

### Step 11: Documentation

#### 11.1 Update Documentation

```markdown
// docs/languages/yo.md
# Yoruba Language Support

## Overview
Yoruba support added on [date]

## Translation Status
- ✅ Common UI: 100%
- ✅ Authentication: 100%
- ✅ Property: 100%
- ⏳ Admin: 80%

## Contributors
- Translator: [Name]
- Reviewer: [Name]

## Regional Settings
- Currency: NGN
- Date Format: DD/MM/YYYY
- Region: Nigeria (Southwest)
```

### Step 12: Deployment

#### 12.1 Feature Flag

```typescript
// Enable gradually with feature flag
const languageFeatureFlags = {
  yo: {
    enabled: false, // Start disabled
    beta: true, // Beta users only
    regions: ['NG'], // Nigeria only
  },
};
```

#### 12.2 Gradual Rollout

1. **Internal Testing**: Enable for team members
2. **Beta Testing**: Enable for select users
3. **Soft Launch**: Enable for 10% of target region
4. **Full Launch**: Enable for all users

#### 12.3 Monitoring

```typescript
// Track language adoption
analytics.track('language_changed', {
  from: previousLanguage,
  to: newLanguage,
  userId: user.id,
});
```

## Language-Specific Considerations

### Nigerian Languages (Yoruba, Igbo, Hausa)

- Consider tone marks and diacritics
- Handle dialectal variations
- Provide glossaries for technical terms
- Consider bilingual speakers' preferences

### Arabic

- RTL layout required
- 6 plural forms
- Different number system (Eastern Arabic numerals optional)
- Calendar differences (Hijri calendar support)

### Swahili

- Used across multiple countries
- Regional variations (Kenyan vs Tanzanian)
- Borrowings from Arabic and English

## Common Pitfalls

### 1. Incomplete Translations
❌ Leaving English fallbacks
✅ Complete all namespaces before launch

### 2. Direct Translation
❌ Word-for-word translation
✅ Adapt phrases idiomatically

### 3. Ignoring Plurals
❌ Using singular form for all counts
✅ Implement proper plural rules

### 4. Hard-coded Formats
❌ Hard-coded date/currency formats
✅ Use locale-aware formatting

### 5. Text Length
❌ Not accounting for text expansion/contraction
✅ Design flexible layouts

## Resources

- [CLDR Plural Rules](https://cldr.unicode.org/)
- [Unicode CLDR](https://cldr.unicode.org/)
- [Yoruba Language Resources](http://www.yorubalanguage.org/)
- [i18next Documentation](https://www.i18next.com/)

## Support

For questions about adding languages:
- Slack: #i18n-languages
- Email: i18n@newcondo.com