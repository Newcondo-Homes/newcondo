# Internationalization (i18n) Documentation

## Overview

The Newcondo platform supports multiple languages and regional customizations to serve users across different markets. This documentation provides a comprehensive guide to our internationalization system.

## Supported Languages

### Current Support
- **English (en)** - Default/Fallback language
- **French (fr)** - West African French
- **Nigerian Pidgin (pcm)** - Nigerian Pidgin English

### Planned Support
- Yoruba (yo)
- Igbo (ig)
- Hausa (ha)
- Swahili (sw)

## Key Features

### 1. Multi-Language Content
- Dynamic language switching without page reload
- Persistent language preference across sessions
- Fallback to English for missing translations
- Context-aware translations

### 2. Currency Localization
- Multi-currency support (NGN, USD, EUR, XOF, GHS)
- Automatic currency formatting based on locale
- Real-time exchange rate integration
- Currency symbol positioning

### 3. Date & Time Formatting
- Locale-specific date formats
- Timezone support for Nigerian regions
- Relative time formatting (e.g., "2 hours ago")
- Cultural calendar considerations

### 4. Number Formatting
- Locale-specific number separators
- Decimal precision customization
- Percentage formatting
- Large number abbreviations (e.g., 1.2M)

### 5. RTL Language Support
- Right-to-left layout for Arabic (future)
- Bidirectional text support
- Mirrored UI components
- RTL-aware CSS utilities

### 6. Regional Compliance
- GDPR compliance for European users
- Nigerian Data Protection Regulation (NDPR)
- Regional payment method integration
- Local legal requirements

## Architecture

### Technology Stack
- **i18next**: Core internationalization framework
- **react-i18next**: React bindings
- **i18next-http-backend**: Dynamic translation loading
- **i18next-browser-languagedetector**: Automatic language detection

### File Structure
```
packages/i18n/
├── src/
│   ├── config/
│   │   ├── i18n.config.ts       # Main i18n configuration
│   │   ├── languages.ts          # Supported languages
│   │   ├── currencies.ts         # Currency configurations
│   │   └── regions.ts            # Regional settings
│   ├── locales/
│   │   ├── en/                   # English translations
│   │   ├── fr/                   # French translations
│   │   └── pcm/                  # Pidgin translations
│   ├── utils/
│   │   ├── currency.ts           # Currency utilities
│   │   ├── date.ts               # Date formatting
│   │   ├── number.ts             # Number formatting
│   │   └── rtl.ts                # RTL utilities
│   └── index.ts
```

## Quick Start

### Installation
```bash
# Install dependencies
pnpm install

# Generate translation types
pnpm run i18n:generate-types

# Validate translations
pnpm run i18n:validate
```

### Basic Usage

#### In React Components
```typescript
import { useTranslation } from '@newcondo/i18n';

function MyComponent() {
  const { t } = useTranslation('common');
  
  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>{t('description', { name: 'John' })}</p>
    </div>
  );
}
```

#### Currency Formatting
```typescript
import { formatCurrency } from '@newcondo/i18n';

const price = formatCurrency(50000, 'NGN', 'en');
// Output: "₦50,000.00"
```

#### Date Formatting
```typescript
import { formatDate } from '@newcondo/i18n';

const date = formatDate(new Date(), 'en', 'long');
// Output: "November 12, 2025"
```

## Translation Guidelines

### Naming Conventions
- Use dot notation for nested keys: `auth.login.title`
- Use camelCase for key names: `propertyDetails`
- Keep keys descriptive but concise
- Group related translations in namespaces

### Interpolation
```json
{
  "greeting": "Hello, {{name}}!",
  "itemCount": "You have {{count}} item",
  "itemCount_other": "You have {{count}} items"
}
```

### Pluralization
```json
{
  "property": "property",
  "property_other": "properties",
  "found": "Found {{count}} property",
  "found_other": "Found {{count}} properties"
}
```

### Context
```json
{
  "available": "Available",
  "available_property": "Available for rent",
  "available_agent": "Available for marking jobs"
}
```

## Regional Customization

### Nigerian Market
- Currency: NGN (Nigerian Naira)
- Date format: DD/MM/YYYY
- Phone format: +234 XXX XXX XXXX
- Address format: House No, Street, LGA, State

### West African Markets
- XOF for Francophone countries
- French language preference
- Regional payment methods
- Local compliance requirements

## Performance Optimization

### Code Splitting
- Translations loaded on-demand
- Namespace-based splitting
- Lazy loading for large translation files

### Caching
- Browser-based translation caching
- CDN delivery for translation files
- Service worker for offline support

### Bundle Size
- Tree-shaking unused translations
- Compression for production builds
- Minimal runtime overhead

## Testing

### Unit Tests
```bash
pnpm run test:i18n
```

### Translation Coverage
```bash
pnpm run i18n:coverage
```

### Validation
```bash
pnpm run i18n:validate
```

## Deployment

### CI/CD Pipeline
- Automated translation validation
- Missing translation detection
- Translation file synchronization
- Type generation and checking

### Environment Variables
```env
NEXT_PUBLIC_DEFAULT_LOCALE=en
NEXT_PUBLIC_SUPPORTED_LOCALES=en,fr,pcm
NEXT_PUBLIC_TRANSLATION_CDN_URL=https://cdn.newcondo.com/translations
```

## Contributing

### Adding New Languages
1. See [Adding Languages Guide](./adding-languages.md)
2. Create locale directory
3. Translate base files
4. Update language configuration
5. Test thoroughly

### Translation Workflow
1. Extract new keys: `pnpm run i18n:extract`
2. Translate in locale files
3. Validate: `pnpm run i18n:validate`
4. Generate types: `pnpm run i18n:generate-types`
5. Submit PR with translations

## Support

### Common Issues
- Missing translations: Check fallback language
- RTL layout issues: Review RTL utilities
- Currency formatting: Verify locale settings
- Date parsing: Ensure proper timezone

### Resources
- [Setup Guide](./setup-guide.md)
- [Translation Guide](./translation-guide.md)
- [Currency Support](./currency-support.md)
- [RTL Support](./rtl-support.md)
- [Regional Compliance](./regional-compliance.md)

### Contact
- Technical issues: tech@newcondo.com
- Translation requests: translations@newcondo.com
- Documentation: docs@newcondo.com

## Version History

### v1.0.0 (Current)
- Initial i18n implementation
- English, French, Pidgin support
- Multi-currency support
- Basic RTL structure

### Roadmap
- v1.1.0: Arabic language support
- v1.2.0: Additional Nigerian languages
- v1.3.0: East African market expansion
- v2.0.0: Real-time collaborative translations

---

**Last Updated**: November 2025  
**Maintained by**: Newcondo Engineering Team