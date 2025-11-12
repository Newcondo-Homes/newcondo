# i18n Setup Guide

## Prerequisites

Before setting up internationalization, ensure you have:

- Node.js 18+ installed
- pnpm package manager
- Access to the Newcondo monorepo
- Basic understanding of React and TypeScript

## Installation Steps

### 1. Install Required Packages

The i18n package is already part of the monorepo. To install dependencies:

```bash
# From monorepo root
pnpm install

# Navigate to i18n package (if needed)
cd packages/i18n
pnpm install
```

### 2. Environment Configuration

Create or update environment variables:

```bash
# apps/platform/.env.local
NEXT_PUBLIC_DEFAULT_LOCALE=en
NEXT_PUBLIC_SUPPORTED_LOCALES=en,fr,pcm
NEXT_PUBLIC_FALLBACK_LOCALE=en
NEXT_PUBLIC_TRANSLATION_CDN_URL=https://cdn.newcondo.com/translations

# Optional: Enable debug mode in development
NEXT_PUBLIC_I18N_DEBUG=true
```

### 3. Initialize i18n in Your App

#### Next.js App (Platform)

```typescript
// apps/platform/app/layout.tsx
import { I18nProvider } from '@newcondo/i18n';
import { detectUserLocale } from '@newcondo/i18n/utils';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = detectUserLocale();

  return (
    <html lang={locale}>
      <body>
        <I18nProvider locale={locale}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
```

#### React App (Admin Dashboard)

```typescript
// apps/admin/src/App.tsx
import { I18nProvider } from '@newcondo/i18n';
import { useEffect, useState } from 'react';

function App() {
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    // Load user's preferred locale
    const savedLocale = localStorage.getItem('userLocale') || 'en';
    setLocale(savedLocale);
  }, []);

  return (
    <I18nProvider locale={locale}>
      {/* Your app content */}
    </I18nProvider>
  );
}

export default App;
```

### 4. Configure Translation Loading

#### Static Import (Recommended for Platform)

```typescript
// packages/i18n/src/config/i18n.config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from '../locales/en/common.json';
import enAuth from '../locales/en/auth.json';
import frCommon from '../locales/fr/common.json';
import frAuth from '../locales/fr/auth.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        auth: enAuth,
      },
      fr: {
        common: frCommon,
        auth: frAuth,
      },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'auth', 'property', 'payment'],
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

#### Dynamic Import (For Large Apps)

```typescript
// packages/i18n/src/config/i18n.config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'auth', 'property', 'payment'],
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      addPath: '/locales/add/{{lng}}/{{ns}}',
    },
    
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator'],
      caches: ['localStorage', 'cookie'],
    },
    
    interpolation: {
      escapeValue: false,
    },
    
    react: {
      useSuspense: true,
    },
  });

export default i18n;
```

### 5. Setup Translation Namespaces

Create the base translation structure:

```bash
packages/i18n/src/locales/
├── en/
│   ├── common.json          # Common UI text
│   ├── auth.json            # Authentication
│   ├── property.json        # Property listings
│   ├── payment.json         # Payments
│   ├── admin.json           # Admin dashboard
│   ├── errors.json          # Error messages
│   └── validation.json      # Form validation
├── fr/
│   └── [same structure]
└── pcm/
    └── [same structure]
```

### 6. Configure TypeScript

```typescript
// packages/i18n/src/types/i18next.d.ts
import 'i18next';
import type common from '../locales/en/common.json';
import type auth from '../locales/en/auth.json';
import type property from '../locales/en/property.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      auth: typeof auth;
      property: typeof property;
    };
  }
}
```

### 7. Generate Type Definitions

```bash
# Generate TypeScript types from translations
pnpm run i18n:generate-types

# This creates type-safe translation keys
```

### 8. Setup Language Switcher

```typescript
// apps/platform/components/shared/LanguageSwitcher.tsx
import { useTranslation } from '@newcondo/i18n';
import { Button } from '@newcondo/ui';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'pcm', label: 'Pidgin' },
  ];

  return (
    <div className="flex gap-2">
      {languages.map((lang) => (
        <Button
          key={lang.code}
          variant={i18n.language === lang.code ? 'default' : 'outline'}
          onClick={() => i18n.changeLanguage(lang.code)}
        >
          {lang.label}
        </Button>
      ))}
    </div>
  );
}
```

### 9. Configure Backend Services

For backend services that need i18n (emails, SMS, etc.):

```typescript
// backend/shared/src/utils/i18n.ts
import i18n from 'i18next';

i18n.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      email: require('../locales/en/email.json'),
      sms: require('../locales/en/sms.json'),
    },
    fr: {
      email: require('../locales/fr/email.json'),
      sms: require('../locales/fr/sms.json'),
    },
  },
});

export function translateEmail(key: string, locale: string, options?: any) {
  return i18n.t(key, { ...options, lng: locale, ns: 'email' });
}

export default i18n;
```

## Development Workflow

### 1. Start Development Server

```bash
# From monorepo root
pnpm dev

# Or specific app
pnpm --filter @newcondo/platform dev
```

### 2. Enable i18n Debug Mode

```typescript
// In your i18n config, add:
{
  debug: process.env.NODE_ENV === 'development',
  saveMissing: true, // Log missing translations
  missingKeyHandler: (lng, ns, key) => {
    console.warn(`Missing translation: ${lng}.${ns}.${key}`);
  },
}
```

### 3. Extract New Translation Keys

```bash
# Scan codebase for new translation keys
pnpm run i18n:extract

# This updates translation JSON files
```

### 4. Validate Translations

```bash
# Check for missing translations
pnpm run i18n:validate

# Check for unused translations
pnpm run i18n:validate --unused
```

## Testing Setup

### Unit Tests with i18n

```typescript
// tests/setup.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common'],
  defaultNS: 'common',
  resources: { en: { common: {} } },
});

export default i18n;
```

```typescript
// Component test example
import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from './tests/setup';
import MyComponent from './MyComponent';

test('renders with translations', () => {
  render(
    <I18nextProvider i18n={i18n}>
      <MyComponent />
    </I18nextProvider>
  );
});
```

## Production Deployment

### 1. Build Translation Assets

```bash
# Build all packages including i18n
pnpm run build

# Translation files are bundled or deployed to CDN
```

### 2. CDN Configuration (Optional)

```typescript
// For serving translations from CDN
{
  backend: {
    loadPath: 'https://cdn.newcondo.com/locales/{{lng}}/{{ns}}.json',
    crossDomain: true,
  }
}
```

### 3. Caching Strategy

```typescript
// Set cache headers for translation files
// In your CDN or server config:
{
  '/locales/**/*.json': {
    'Cache-Control': 'public, max-age=86400', // 24 hours
    'ETag': true,
  }
}
```

## Troubleshooting

### Common Issues

#### Translations Not Loading
- Check file paths in backend config
- Verify namespace names match file names
- Ensure translations are imported/loaded

#### Language Not Switching
- Check localStorage/cookie persistence
- Verify language detector configuration
- Clear browser cache

#### Type Errors
- Run `pnpm run i18n:generate-types`
- Ensure all namespaces are declared
- Check TypeScript configuration

#### Missing Translations
- Run `pnpm run i18n:validate`
- Check fallback language has all keys
- Review console warnings

### Debug Commands

```bash
# Validate all translations
pnpm run i18n:validate

# Generate types
pnpm run i18n:generate-types

# Sync translations across languages
pnpm run i18n:sync

# Extract new keys
pnpm run i18n:extract

# Check coverage
pnpm run i18n:coverage
```

## Next Steps

- Read the [Translation Guide](./translation-guide.md)
- Learn about [Adding Languages](./adding-languages.md)
- Explore [Currency Support](./currency-support.md)
- Review [RTL Support](./rtl-support.md)

## Support

For setup issues:
- Check logs: `pnpm run dev --verbose`
- Review documentation: `/docs/i18n`
- Contact: tech@newcondo.com