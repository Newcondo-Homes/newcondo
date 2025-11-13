# RTL (Right-to-Left) Support Documentation

## Overview

This guide covers implementing and maintaining Right-to-Left (RTL) language support for languages like Arabic, Hebrew, Persian, and Urdu on the Newcondo platform.

## Understanding RTL

### What is RTL?

RTL (Right-to-Left) languages are written and read from right to left, opposite to LTR (Left-to-Right) languages like English, French, and most African languages.

### RTL Languages

Common RTL languages we may support:
- **Arabic (ar)**: Used across North Africa and Middle East
- **Hebrew (he)**: Israel
- **Persian/Farsi (fa)**: Iran
- **Urdu (ur)**: Pakistan

## Configuration

### Language Configuration

```typescript
// packages/i18n/src/config/languages.ts

export const supportedLanguages: LanguageConfig[] = [
  // LTR Languages
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    flag: '🇬🇧',
    enabled: true,
  },
  // RTL Languages
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    flag: '🇸🇦',
    enabled: false, // Enable when ready
    region: 'Middle East & North Africa',
  },
];
```

### RTL Detection Utility

```typescript
// packages/i18n/src/utils/rtl.ts

/**
 * Check if a locale uses RTL direction
 */
export function isRTL(locale: string): boolean {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur', 'yi', 'ji'];
  const languageCode = locale.split('-')[0].toLowerCase();
  return rtlLanguages.includes(languageCode);
}

/**
 * Get text direction for a locale
 */
export function getDirection(locale: string): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

/**
 * Get opposite direction
 */
export function getOppositeDirection(direction: 'ltr' | 'rtl'): 'ltr' | 'rtl' {
  return direction === 'rtl' ? 'ltr' : 'rtl';
}

/**
 * Apply RTL-aware positioning
 */
export function getLogicalPosition(
  position: 'left' | 'right',
  direction: 'ltr' | 'rtl'
): 'left' | 'right' {
  if (direction === 'rtl') {
    return position === 'left' ? 'right' : 'left';
  }
  return position;
}

/**
 * Convert physical to logical properties
 */
export function getLogicalProperty(
  property: string,
  direction: 'ltr' | 'rtl'
): string {
  if (direction === 'ltr') return property;

  const rtlMap: Record<string, string> = {
    'margin-left': 'margin-right',
    'margin-right': 'margin-left',
    'padding-left': 'padding-right',
    'padding-right': 'padding-left',
    'border-left': 'border-right',
    'border-right': 'border-left',
    'left': 'right',
    'right': 'left',
    'text-align-left': 'text-align-right',
    'text-align-right': 'text-align-left',
  };

  return rtlMap[property] || property;
}
```

## HTML Structure

### Root HTML Element

```typescript
// apps/platform/app/layout.tsx

import { detectUserLocale } from '@newcondo/i18n/utils';
import { getDirection } from '@newcondo/i18n/utils/rtl';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = detectUserLocale();
  const direction = getDirection(locale);

  return (
    <html lang={locale} dir={direction}>
      <body>
        <I18nProvider locale={locale}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
```

### Dynamic Direction Change

```typescript
// components/LanguageSwitcher.tsx

import { useTranslation } from '@newcondo/i18n';
import { getDirection } from '@newcondo/i18n/utils/rtl';
import { useEffect } from 'react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const direction = getDirection(i18n.language);
    document.documentElement.dir = direction;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // ... rest of component
}
```

## CSS Implementation

### Logical Properties (Recommended)

Use CSS logical properties that automatically adapt to text direction:

```css
/* packages/ui/src/styles/rtl.css */

/* ✅ Use logical properties */
.container {
  /* Instead of margin-left/right */
  margin-inline-start: 1rem;
  margin-inline-end: 2rem;
  
  /* Instead of padding-left/right */
  padding-inline: 1rem;
  
  /* Instead of border-left/right */
  border-inline-start: 1px solid gray;
  
  /* Instead of left/right positioning */
  inset-inline-start: 0;
  
  /* Text alignment */
  text-align: start; /* Left in LTR, Right in RTL */
  text-align: end;   /* Right in LTR, Left in RTL */
}

/* Block direction properties */
.vertical-spacing {
  margin-block-start: 1rem;  /* margin-top */
  margin-block-end: 1rem;    /* margin-bottom */
  padding-block: 1rem;       /* padding-top + padding-bottom */
}
```

### RTL-Specific Styles

```css
/* Apply RTL-specific styles */
[dir='rtl'] .arrow-icon {
  transform: scaleX(-1); /* Flip horizontally */
}

[dir='rtl'] .breadcrumb-separator::after {
  content: '‹'; /* Use left-pointing arrow */
}

[dir='ltr'] .breadcrumb-separator::after {
  content: '›'; /* Use right-pointing arrow */
}
```

### Tailwind CSS with RTL

```typescript
// tailwind.config.js

module.exports = {
  // Enable RTL plugin
  plugins: [
    require('tailwindcss-rtl'),
  ],
  // ... other config
};
```

```tsx
// Usage with Tailwind
<div className="ms-4 me-2">  {/* margin-start, margin-end */}
  <div className="ps-2">     {/* padding-start */}
    <span className="float-start"> {/* float left/right based on direction */}
      Content
    </span>
  </div>
</div>

// RTL-specific utilities
<div className="ltr:ml-4 rtl:mr-4">
  Directional margin
</div>
```

### Custom RTL Hook

```typescript
// packages/i18n/src/hooks/useRTL.ts

import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { isRTL, getDirection } from '../utils/rtl';

export function useRTL() {
  const { i18n } = useTranslation();

  const direction = useMemo(
    () => getDirection(i18n.language),
    [i18n.language]
  );

  const isRTLMode = useMemo(
    () => isRTL(i18n.language),
    [i18n.language]
  );

  return {
    isRTL: isRTLMode,
    direction,
    align: {
      start: isRTLMode ? 'right' : 'left',
      end: isRTLMode ? 'left' : 'right',
    },
    float: {
      start: isRTLMode ? 'right' : 'left',
      end: isRTLMode ? 'left' : 'right',
    },
  };
}

// Usage
function MyComponent() {
  const { isRTL, direction, align } = useRTL();

  return (
    <div style={{ textAlign: align.start }}>
      {isRTL ? 'مرحبا' : 'Hello'}
    </div>
  );
}
```

## Component Adaptations

### Navigation Components

```typescript
// components/shared/navigation/Sidebar.tsx

import { useRTL } from '@newcondo/i18n/hooks';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export function Sidebar() {
  const { isRTL } = useRTL();
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <nav className="sidebar">
      <ul>
        <li>
          <a href="/dashboard" className="flex items-center justify-between">
            <span>Dashboard</span>
            <ChevronIcon className="w-4 h-4" />
          </a>
        </li>
      </ul>
    </nav>
  );
}
```

### Breadcrumbs

```typescript
// components/shared/navigation/Breadcrumbs.tsx

import { useRTL } from '@newcondo/i18n/hooks';

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const { isRTL } = useRTL();
  const separator = isRTL ? '‹' : '›';

  return (
    <nav className="flex items-center gap-2">
      {items.map((item, index) => (
        <Fragment key={item.href}>
          <a href={item.href}>{item.label}</a>
          {index < items.length - 1 && (
            <span className="text-muted-foreground">{separator}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
```

### Forms

```typescript
// components/forms/PropertyForm.tsx

import { useRTL } from '@newcondo/i18n/hooks';

export function PropertyForm() {
  const { align } = useRTL();

  return (
    <form>
      <div className="space-y-4">
        <FormField
          label="Property Title"
          name="title"
          style={{ textAlign: align.start }}
        />
        
        {/* Currency input - symbol position changes with RTL */}
        <CurrencyInput
          currency="NGN"
          align={align.start}
        />

        {/* Checkboxes - align to start */}
        <div className="flex items-center" style={{ justifyContent: `flex-${align.start}` }}>
          <Checkbox id="terms" />
          <label htmlFor="terms" className="ms-2">
            I agree to terms
          </label>
        </div>
      </div>
    </form>
  );
}
```

### Modal/Dialog

```typescript
// packages/ui/src/components/Modal.tsx

import { useRTL } from '@newcondo/i18n/hooks';
import { X } from 'lucide-react';

export function Modal({ children, onClose }: ModalProps) {
  const { align } = useRTL();

  return (
    <div className="modal">
      <div className="modal-header">
        <button
          onClick={onClose}
          className="absolute top-4"
          style={{ [align.end]: '1rem' }}
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="modal-content" style={{ textAlign: align.start }}>
        {children}
      </div>
    </div>
  );
}
```

### Data Tables

```typescript
// components/admin/UserTable.tsx

import { useRTL } from '@newcondo/i18n/hooks';

export function UserTable({ users }: { users: User[] }) {
  const { align } = useRTL();

  return (
    <table className="w-full" dir={useRTL().direction}>
      <thead>
        <tr>
          <th style={{ textAlign: align.start }}>Name</th>
          <th style={{ textAlign: align.start }}>Email</th>
          <th style={{ textAlign: align.end }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td style={{ textAlign: align.start }}>{user.name}</td>
            <td style={{ textAlign: align.start }}>{user.email}</td>
            <td style={{ textAlign: align.end }}>
              <Button size="sm">Edit</Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Icon Handling

### Directional Icons

```typescript
// packages/ui/src/components/DirectionalIcon.tsx

import { useRTL } from '@newcondo/i18n/hooks';
import { LucideIcon } from 'lucide-react';

interface DirectionalIconProps {
  ltrIcon: LucideIcon;
  rtlIcon: LucideIcon;
  className?: string;
}

export function DirectionalIcon({
  ltrIcon: LTRIcon,
  rtlIcon: RTLIcon,
  className,
}: DirectionalIconProps) {
  const { isRTL } = useRTL();
  const Icon = isRTL ? RTLIcon : LTRIcon;

  return <Icon className={className} />;
}

// Usage
import { ChevronRight, ChevronLeft } from 'lucide-react';

<DirectionalIcon
  ltrIcon={ChevronRight}
  rtlIcon={ChevronLeft}
  className="w-4 h-4"
/>
```

### Auto-Flip Icons

```typescript
// For icons that should flip in RTL
<Icon className={cn(
  "w-6 h-6",
  useRTL().isRTL && "scale-x-[-1]" // Flip horizontally
)} />
```

## Date and Number Formatting

### Date Formatting with RTL

```typescript
// packages/i18n/src/utils/date.ts

import { isRTL } from './rtl';

export function formatDate(
  date: Date,
  locale: string,
  format: 'short' | 'medium' | 'long' = 'medium'
): string {
  const options: Intl.DateTimeFormatOptions = {
    short: { month: 'numeric', day: 'numeric', year: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
  }[format];

  const formatted = new Intl.DateTimeFormat(locale, options).format(date);

  // Add RTL markers if needed
  if (isRTL(locale)) {
    return `\u200F${formatted}\u200F`; // Right-to-left marks
  }

  return formatted;
}

// Arabic example:
formatDate(new Date(), 'ar', 'long')
// Output: ‏١٢ نوفمبر ٢٠٢٥‏
```

### Number Formatting

```typescript
// Arabic uses Eastern Arabic numerals (optional)
export function formatNumber(
  num: number,
  locale: string,
  useNativeDigits: boolean = true
): string {
  const options = useNativeDigits
    ? { numberingSystem: 'arab' } // Eastern Arabic numerals
    : undefined;

  return new Intl.NumberFormat(locale, options).format(num);
}

// Examples:
formatNumber(12345, 'ar', true)   // ١٢٬٣٤٥
formatNumber(12345, 'ar', false)  // 12,345
```

## Testing RTL

### Visual Testing

```typescript
// Create RTL testing utilities
// packages/i18n/tests/rtl-test-utils.tsx

import { render, RenderOptions } from '@testing-library/react';
import { I18nProvider } from '@newcondo/i18n';

interface RTLRenderOptions extends RenderOptions {
  locale?: string;
}

export function renderWithRTL(
  ui: React.ReactElement,
  { locale = 'ar', ...options }: RTLRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <I18nProvider locale={locale}>{children}</I18nProvider>;
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// Usage in tests
describe('PropertyCard RTL', () => {
  it('renders correctly in RTL', () => {
    const { container } = renderWithRTL(<PropertyCard {...props} />, {
      locale: 'ar',
    });

    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });
});
```

### Automated Testing

```typescript
// Test RTL component behavior
describe('RTL Support', () => {
  test('applies RTL direction to HTML element', () => {
    renderWithRTL(<App />, { locale: 'ar' });
    expect(document.documentElement.dir).toBe('rtl');
  });

  test('flips icons in RTL mode', () => {
    const { getByTestId } = renderWithRTL(
      <DirectionalIcon ltrIcon={ChevronRight} rtlIcon={ChevronLeft} />,
      { locale: 'ar' }
    );
    // Assert correct icon is rendered
  });

  test('aligns text to right in RTL', () => {
    const { getByText } = renderWithRTL(<Text>مرحبا</Text>, { locale: 'ar' });
    const element = getByText('مرحبا');
    expect(getComputedStyle(element).textAlign).toBe('right');
  });
});
```

## Best Practices

### 1. Use Logical Properties

```css
/* ✅ Good - Uses logical properties */
.button {
  margin-inline-start: 1rem;
  padding-inline: 2rem;
}

/* ❌ Bad - Uses physical properties */
.button {
  margin-left: 1rem;
  padding-left: 2rem;
  padding-right: 2rem;
}
```

### 2. Avoid Hard-coded Directions

```tsx
// ✅ Good - Direction-aware
const { align } = useRTL();
<div style={{ textAlign: align.start }} />

// ❌ Bad - Hard-coded
<div style={{ textAlign: 'left' }} />
```

### 3. Test Both Directions

Always test your components in both LTR and RTL modes:

```bash
# Test in different locales
LOCALE=en pnpm dev  # LTR
LOCALE=ar pnpm dev  # RTL
```

### 4. Mirror Interactive Elements

```tsx
// Flip interactive elements in RTL
<Carousel
  nextIcon={<DirectionalIcon ltrIcon={ChevronRight} rtlIcon={ChevronLeft} />}
  prevIcon={<DirectionalIcon ltrIcon={ChevronLeft} rtlIcon={ChevronRight} />}
/>
```

### 5. Handle Mixed Content

```tsx
// When mixing LTR and RTL content
<div dir="auto">  {/* Auto-detect direction */}
  {content}
</div>

// Or explicit direction
<span dir="ltr">+234 808 123 4567</span>  {/* Phone always LTR */}
<span dir="rtl">{arabicText}</span>
```

## Common Pitfalls

### 1. Forgotten Icons

❌ Arrow icons not flipping  
✅ Use DirectionalIcon component or flip with CSS

### 2. Hard-coded Margins

❌ `ml-4` in Tailwind  
✅ `ms-4` (margin-start)

### 3. Absolute Positioning

❌ `left: 0`  
✅ `inset-inline-start: 0`

### 4. Floating Elements

❌ `float: left`  
✅ `float: inline-start` or use flexbox

### 5. Text Alignment

❌ `text-align: left`  
✅ `text-align: start`

## Browser Support

RTL features are well-supported in modern browsers:
- CSS Logical Properties: Chrome 69+, Firefox 41+, Safari 12.1+
- `dir` attribute: Universal support
- Intl APIs: Modern browsers

### Fallbacks

```css
/* Provide fallbacks for older browsers */
.container {
  margin-left: 1rem; /* Fallback */
  margin-inline-start: 1rem; /* Modern */
}

/* Or use @supports */
@supports (margin-inline-start: 0) {
  .container {
    margin-inline-start: 1rem;
  }
}
```

## Resources

- [CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties)
- [Bi-Directional Text](https://www.w3.org/International/questions/qa-bidi-controls)
- [RTL Styling 101](https://rtlstyling.com/)
- [Material Design RTL](https://material.io/design/usability/bidirectionality.html)

## Checklist

Before launching RTL support:

- [ ] HTML `dir` attribute updates dynamically
- [ ] All margins/padding use logical properties
- [ ] Icons flip appropriately
- [ ] Text alignment uses `start`/`end`
- [ ] Forms work correctly in RTL
- [ ] Navigation components adapt
- [ ] Tables display properly
- [ ] Modals/dialogs positioned correctly
- [ ] Dates format appropriately
- [ ] Numbers use correct numeral system
- [ ] All components tested in RTL
- [ ] No layout breaks in RTL mode
- [ ] Performance is acceptable

## Support

For RTL-related questions:
- Email: rtl@newcondo.com
- Slack: #i18n-rtl