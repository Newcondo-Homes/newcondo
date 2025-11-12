# Translation Guide

## Overview

This guide covers best practices for creating, managing, and maintaining translations across the Newcondo platform.

## Translation Structure

### Namespace Organization

Translations are organized by feature domains:

```
locales/
├── en/
│   ├── common.json          # UI elements, buttons, labels
│   ├── auth.json            # Login, registration, verification
│   ├── property.json        # Property listings, search, details
│   ├── payment.json         # Payments, transactions, receipts
│   ├── admin.json           # Admin dashboard
│   ├── marking.json         # Property marking service
│   ├── referral.json        # Referral system
│   ├── errors.json          # Error messages
│   ├── validation.json      # Form validation messages
│   ├── email.json           # Email templates
│   └── sms.json             # SMS templates
```

### Key Naming Conventions

#### Use Descriptive, Hierarchical Keys

```json
{
  "property": {
    "listing": {
      "title": "Property Listings",
      "create": "Create Listing",
      "edit": "Edit Listing"
    },
    "details": {
      "bedrooms": "Bedrooms",
      "bathrooms": "Bathrooms",
      "price": "Price"
    }
  }
}
```

#### Avoid Deep Nesting (Max 3 Levels)

```json
// ✅ Good
{
  "auth": {
    "login": {
      "title": "Sign In"
    }
  }
}

// ❌ Avoid
{
  "pages": {
    "auth": {
      "forms": {
        "login": {
          "fields": {
            "title": "Sign In"
          }
        }
      }
    }
  }
}
```

## Translation Patterns

### 1. Simple Strings

```json
{
  "welcome": "Welcome to Newcondo",
  "loading": "Loading...",
  "save": "Save",
  "cancel": "Cancel"
}
```

Usage:
```typescript
const { t } = useTranslation('common');
<button>{t('save')}</button>
```

### 2. Interpolation

```json
{
  "greeting": "Hello, {{name}}!",
  "propertyPrice": "Price: {{price}} per month",
  "searchResults": "Found {{count}} properties in {{city}}"
}
```

Usage:
```typescript
t('greeting', { name: 'John' })
// Output: "Hello, John!"

t('propertyPrice', { price: formatCurrency(50000, 'NGN') })
// Output: "Price: ₦50,000.00 per month"
```

### 3. Pluralization

```json
{
  "property_one": "{{count}} property",
  "property_other": "{{count}} properties",
  
  "notification_zero": "No new notifications",
  "notification_one": "{{count}} new notification",
  "notification_other": "{{count}} new notifications"
}
```

Usage:
```typescript
t('property', { count: 1 })  // "1 property"
t('property', { count: 5 })  // "5 properties"
t('notification', { count: 0 })  // "No new notifications"
```

### 4. Context

```json
{
  "available": "Available",
  "available_property": "Available for rent",
  "available_agent": "Available for marking jobs",
  "available_time": "Available time slots"
}
```

Usage:
```typescript
t('available')  // "Available"
t('available', { context: 'property' })  // "Available for rent"
t('available', { context: 'agent' })  // "Available for marking jobs"
```

### 5. Dates and Times

```json
{
  "createdAt": "Created on {{date, datetime}}",
  "expiresIn": "Expires in {{days}} days",
  "lastSeen": "Last seen {{time, fromNow}}",
  "scheduledFor": "Scheduled for {{date, date}}"
}
```

Usage:
```typescript
t('createdAt', { date: new Date() })
// Output: "Created on November 12, 2025, 10:30 AM"

t('lastSeen', { time: new Date() })
// Output: "Last seen a few seconds ago"
```

### 6. Lists and Arrays

```json
{
  "features": "Features: {{features, list}}",
  "locations": "Available in: {{cities, list(style: long; type: conjunction)}}"
}
```

Usage:
```typescript
t('features', { 
  features: ['Parking', 'Generator', 'Security'] 
})
// Output: "Features: Parking, Generator, and Security"
```

### 7. Currency Formatting

```json
{
  "rent": "Rent: {{amount, currency}}",
  "total": "Total: {{amount, currency(NGN)}}",
  "deposit": "Security deposit: {{amount, currency(minimumFractionDigits: 0)}}"
}
```

Usage:
```typescript
t('rent', { 
  amount: 50000,
  formatParams: {
    amount: { currency: 'NGN' }
  }
})
// Output: "Rent: ₦50,000.00"
```

### 8. Rich Text / HTML

```json
{
  "termsAcceptance": "I agree to the <1>Terms and Conditions</1> and <3>Privacy Policy</3>",
  "markingInfo": "Property marking takes <strong>up to 3 days</strong>",
  "alert": "<p>Important: <em>Please verify property details before payment</em></p>"
}
```

Usage:
```typescript
// Using Trans component
import { Trans } from 'react-i18next';

<Trans i18nKey="termsAcceptance">
  I agree to the <Link href="/terms">Terms and Conditions</Link> and 
  <Link href="/privacy">Privacy Policy</Link>
</Trans>
```

## Language-Specific Guidelines

### English (en) - Base Language

- Use clear, concise language
- Avoid jargon and technical terms
- Keep tone professional but friendly
- Use active voice
- Be explicit rather than implicit

```json
{
  "good": "Create your property listing",
  "avoid": "Listing creation interface"
}
```

### French (fr) - West African French

- Use formal "vous" for general audience
- Consider regional variations (African French vs European French)
- Adapt currency symbols (XOF for Francophone countries)
- Use appropriate measurement units

```json
{
  "en": "Create your listing",
  "fr": "Créez votre annonce"
}
```

**Regional Considerations:**
```json
{
  "fr-FR": "appartement",  // European French
  "fr-CI": "logement"      // Ivorian French - may prefer different terms
}
```

### Nigerian Pidgin (pcm)

- Keep expressions natural and conversational
- Use common Pidgin phrases
- Maintain clarity despite informal tone
- Adapt to Nigerian cultural context

```json
{
  "en": "Create your property listing",
  "pcm": "Add your house for rent"
}
```

**Pidgin Examples:**
```json
{
  "welcome": "Welcome to Newcondo",
  "welcome_pcm": "You don welcome",
  
  "loading": "Loading...",
  "loading_pcm": "We dey load am...",
  
  "error": "An error occurred",
  "error_pcm": "Wahala don happen",
  
  "success": "Operation successful",
  "success_pcm": "E don work!"
}
```

## Domain-Specific Translations

### Authentication (auth.json)

```json
{
  "login": {
    "title": "Sign In",
    "email": "Email Address",
    "password": "Password",
    "submit": "Sign In",
    "forgotPassword": "Forgot Password?",
    "noAccount": "Don't have an account?",
    "signUp": "Sign Up"
  },
  "register": {
    "title": "Create Account",
    "userType": "I am a",
    "userTypes": {
      "owner": "Property Owner",
      "agent": "Agent",
      "renter": "Renter"
    }
  },
  "verification": {
    "title": "Verify Your Account",
    "enterOTP": "Enter the code sent to {{contact}}",
    "resend": "Resend Code",
    "verify": "Verify"
  }
}
```

### Property (property.json)

```json
{
  "listing": {
    "create": "Create Listing",
    "title": "Property Title",
    "description": "Description",
    "price": "Monthly Rent",
    "location": "Location",
    "type": "Property Type",
    "bedrooms": "Bedrooms",
    "bathrooms": "Bathrooms",
    "features": "Features",
    "images": "Property Images"
  },
  "marking": {
    "title": "Mark Property Location",
    "instruction": "Draw a box around your property on the map",
    "options": {
      "self": "Mark it myself",
      "assign": "Assign to Newcondo agent",
      "sendLink": "Send link to someone"
    },
    "fee": "Marking fee: {{amount}}",
    "confirmation": "Please confirm the marked property is correct"
  },
  "types": {
    "APARTMENT": "Apartment",
    "HOUSE": "House",
    "DUPLEX": "Duplex",
    "ROOM": "Single Room",
    "SHARED_APARTMENT": "Shared Apartment"
  },
  "status": {
    "AVAILABLE": "Available",
    "RENTED": "Rented",
    "PENDING": "Pending Approval",
    "UNAVAILABLE": "Unavailable"
  }
}
```

### Payment (payment.json)

```json
{
  "rent": {
    "title": "Pay Rent",
    "amount": "Amount to Pay",
    "serviceFee": "Service Fee",
    "total": "Total",
    "confirm": "I confirm this property is available",
    "submit": "Proceed to Payment"
  },
  "confirmation": {
    "title": "Payment Confirmation Period",
    "message": "You have {{hours}} hours to confirm or cancel",
    "confirm": "Confirm Property",
    "cancel": "Request Refund"
  },
  "status": {
    "PENDING": "Pending",
    "SUCCESS": "Successful",
    "FAILED": "Failed",
    "REFUNDED": "Refunded",
    "HELD": "Payment Held"
  },
  "receipt": {
    "title": "Payment Receipt",
    "reference": "Reference: {{ref}}",
    "date": "Date: {{date}}",
    "property": "Property: {{title}}",
    "amount": "Amount Paid: {{amount}}"
  }
}
```

### Errors (errors.json)

```json
{
  "general": {
    "unknown": "An unexpected error occurred",
    "network": "Network error. Please check your connection",
    "timeout": "Request timed out. Please try again"
  },
  "auth": {
    "invalidCredentials": "Invalid email or password",
    "emailExists": "Email already registered",
    "phoneExists": "Phone number already registered",
    "invalidOTP": "Invalid verification code",
    "expiredOTP": "Verification code expired"
  },
  "property": {
    "notFound": "Property not found",
    "alreadyMarked": "This property has already been marked",
    "overlappingBoundary": "Property boundary overlaps with existing property",
    "unauthorized": "You don't have permission to edit this property"
  },
  "payment": {
    "insufficientFunds": "Insufficient funds",
    "paymentFailed": "Payment failed. Please try again",
    "alreadyPaid": "Payment already processed for this property",
    "refundFailed": "Refund request failed"
  }
}
```

### Validation (validation.json)

```json
{
  "required": "{{field}} is required",
  "email": "Please enter a valid email address",
  "phone": "Please enter a valid phone number",
  "password": {
    "minLength": "Password must be at least {{min}} characters",
    "uppercase": "Password must contain at least one uppercase letter",
    "lowercase": "Password must contain at least one lowercase letter",
    "number": "Password must contain at least one number",
    "special": "Password must contain at least one special character"
  },
  "number": {
    "min": "{{field}} must be at least {{min}}",
    "max": "{{field}} must not exceed {{max}}",
    "positive": "{{field}} must be a positive number"
  },
  "file": {
    "size": "File size must not exceed {{max}}",
    "type": "Only {{types}} files are allowed",
    "required": "Please upload {{field}}"
  }
}
```

## Best Practices

### 1. Keep Keys Generic When Possible

```json
// ✅ Good - Reusable across contexts
{
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit"
  }
}

// ❌ Avoid - Too specific
{
  "savePropertyButton": "Save Property",
  "saveProfileButton": "Save Profile"
}
```

### 2. Group Related Translations

```json
{
  "property": {
    "actions": {
      "create": "Create",
      "edit": "Edit",
      "delete": "Delete",
      "view": "View Details"
    },
    "status": {
      "available": "Available",
      "rented": "Rented"
    }
  }
}
```

### 3. Handle Edge Cases

```json
{
  "search": {
    "results_zero": "No properties found",
    "results_one": "Found {{count}} property",
    "results_other": "Found {{count}} properties",
    "results_tooMany": "Showing first {{limit}} of {{total}} properties"
  }
}
```

### 4. Provide Context in Comments

```json
{
  // User greeting shown in dashboard header
  "dashboard": {
    "greeting": "Welcome back, {{name}}!"
  },
  
  // Property marking confirmation modal
  "marking": {
    "confirmTitle": "Confirm Property Location"
  }
}
```

### 5. Consider Length Variations

```json
{
  "button": {
    "submit": "Submit",
    "submitShort": "OK",
    "submitLong": "Submit Application"
  }
}
```

### 6. Use Consistent Terminology

Create a glossary and stick to it:

```json
{
  // Always use "listing" not "advertisement" or "posting"
  "property": "property",
  "listing": "listing",
  "rent": "rent",
  "owner": "owner",
  "agent": "agent",
  "renter": "renter",
  "marking": "marking",
  "confirmation": "confirmation"
}
```

## Translation Workflow

### 1. Add New Keys

```bash
# Extract new translation keys from code
pnpm run i18n:extract
```

### 2. Translate

1. Open relevant JSON file
2. Add translations for all supported languages
3. Use translation service if needed (but review carefully)

### 3. Validate

```bash
# Check for missing translations
pnpm run i18n:validate

# Check for unused keys
pnpm run i18n:validate --unused
```

### 4. Generate Types

```bash
# Generate TypeScript types for type safety
pnpm run i18n:generate-types
```

### 5. Test

- Test in all supported languages
- Check text overflow/truncation
- Verify RTL layout (if applicable)
- Test pluralization with different counts

## Quality Checklist

- [ ] All keys translated in supported languages
- [ ] Pluralization rules implemented
- [ ] Context variants provided where needed
- [ ] No hard-coded strings in code
- [ ] Consistent terminology
- [ ] Cultural appropriateness checked
- [ ] No offensive or ambiguous terms
- [ ] Length variations considered for UI
- [ ] RTL compatibility (if applicable)
- [ ] Types generated and validated

## Resources

- [i18next Documentation](https://www.i18next.com/)
- [ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
- [CLDR Pluralization Rules](https://cldr.unicode.org/index/cldr-spec/plural-rules)
- Style Guide: `/docs/i18n/style-guide.md`

## Support

For translation questions:
- Slack: #i18n-translations
- Email: translations@newcondo.com