# @newcondo/i18n

Shared internationalization (i18n) package for the Newcondo monorepo. Provides consistent translation management, locale handling, and currency formatting across all applications.

## Features

- 🌍 **Multi-language Support**: English (default), with ready expansion for French and Nigerian Pidgin
- 💱 **Currency Localization**: Automatic currency formatting based on locale (NGN, USD, EUR, etc.)
- 📅 **Date/Time Formatting**: Locale-aware date and time formatting
- 🔄 **RTL Support**: Structure ready for right-to-left languages
- 🎯 **Type-safe**: Full TypeScript support with type definitions
- 🪝 **React Hooks**: Easy-to-use hooks for translations and locale management
- 🌐 **Server-side Detection**: Automatic language detection for Next.js SSR

## Installation

This package is part of the monorepo and should be imported as a workspace dependency:

```json
{
  "dependencies": {
    "@newcondo/i18n": "workspace:*"
  }
}
```

## Usage

### Basic Setup (Next.js App)

```typescript
// app/layout.tsx
import { I18nProvider } from '@newcondo/i18n';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
```

### Using Translations in Components

```typescript
import { useTranslation } from '@newcondo/i18n';

export function MyComponent() {
  const { t } = useTranslation('common');
  
  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>{t('description', { name: 'John' })}</p>
    </div>
  );
}
```

### Currency Formatting

```typescript
import { useCurrency } from '@newcondo/i18n';

export function PriceDisplay({ amount }: { amount: number }) {
  const { formatCurrency } = useCurrency();
  
  return <span>{formatCurrency(amount)}</span>;
  // Outputs: ₦150,000 (for NGN locale)
}
```

### Locale Management

```typescript
import { useLocale } from '@newcondo/i18n';

export function LanguageSwitcher() {
  const { locale, changeLocale, availableLocales } = useLocale();
  
  return (
    <select value={locale} onChange={(e) => changeLocale(e.target.value)}>
      {availableLocales.map(loc => (
        <option key={loc.code} value={loc.code}>
          {loc.name}
        </option>
      ))}
    </select>
  );
}
```

## Translation Namespaces

Translations are organized into namespaces for better organization:

- `common`: General UI text (buttons, labels, common phrases)
- `auth`: Authentication-related text (login, register, verify)
- `property`: Property listing text (titles, descriptions, filters)
- `payment`: Payment and transaction text
- `profile`: User profile and settings text
- `admin`: Admin dashboard text
- `errors`: Error messages and validation text
- `marking`: Property marking service text
- `legal`: Terms, conditions, and legal text

## Configuration

### Environment Variables

```env
# Default locale (fallback)
NEXT_PUBLIC_DEFAULT_LOCALE=en

# Supported locales (comma-separated)
NEXT_PUBLIC_SUPPORTED_LOCALES=en,fr,pcm

# Enable debug mode
NEXT_PUBLIC_I18N_DEBUG=false
```

## File Structure

```
packages/i18n/
├── src/
│   ├── config/
│   │   ├── i18n.config.ts      # Main i18n configuration
│   │   ├── namespaces.ts       # Translation namespaces
│   │   └── locales.ts          # Available locales and settings
│   ├── hooks/
│   │   ├── useTranslation.ts   # Translation hook
│   │   ├── useLocale.ts        # Locale management hook
│   │   └── useCurrency.ts      # Currency formatting hook
│   ├── middleware/
│   │   └── languageDetection.ts # Server-side language detection
│   └── index.ts                # Package exports
└── locales/                    # Translation files (not in src/)
    ├── en/
    │   ├── common.json
    │   ├── auth.json
    │   └── ...
    ├── fr/
    └── pcm/
```

## Adding New Languages

1. Create a new locale directory under `locales/`:
```bash
mkdir -p locales/fr
```

2. Add translation files for each namespace:
```json
// locales/fr/common.json
{
  "welcome": "Bienvenue",
  "description": "Bonjour {{name}}"
}
```

3. Register the locale in `src/config/locales.ts`:
```typescript
{
  code: 'fr',
  name: 'Français',
  nativeName: 'Français',
  currency: 'EUR',
  direction: 'ltr'
}
```

## Best Practices

1. **Always use translation keys**: Never hardcode text in components
2. **Use meaningful namespaces**: Group related translations together
3. **Provide context with variables**: Use interpolation for dynamic content
4. **Test with different locales**: Ensure layouts work with longer/shorter text
5. **Handle pluralization**: Use i18next plural forms for countable items
6. **Format dates/currencies properly**: Use provided utilities

## Contributing

When adding new features that require translations:

1. Add translation keys to all supported language files
2. Use descriptive key names (e.g., `auth.login.emailPlaceholder`)
3. Include comments in JSON files for context if needed
4. Test with RTL languages if applicable

## License

MIT