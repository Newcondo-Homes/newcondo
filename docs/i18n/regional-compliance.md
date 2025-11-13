# Regional Compliance Documentation

## Overview

This document outlines compliance requirements, legal considerations, and regional adaptations needed when internationalizing the Newcondo platform across different markets.

## Data Protection & Privacy

### Nigeria - NDPR (Nigerian Data Protection Regulation)

#### Requirements
- User consent for data collection
- Data processing transparency
- Right to access personal data
- Right to data portability
- Data breach notification (72 hours)
- Local data storage preference

#### Implementation

```typescript
// packages/i18n/src/config/compliance.ts

export interface ComplianceConfig {
  region: string;
  dataProtectionLaw: string;
  consentRequired: boolean;
  dataLocalization: boolean;
  breachNotificationHours: number;
  minorAge: number;
  cookieConsent: 'opt-in' | 'opt-out';
}

export const complianceConfigs: Record<string, ComplianceConfig> = {
  'NG': {
    region: 'Nigeria',
    dataProtectionLaw: 'NDPR',
    consentRequired: true,
    dataLocalization: false, // Recommended but not strictly required
    breachNotificationHours: 72,
    minorAge: 18,
    cookieConsent: 'opt-in',
  },
};
```

#### Privacy Policy Adaptation

```json
// packages/i18n/src/locales/en/legal.json
{
  "privacy": {
    "ndpr": {
      "title": "Your Privacy Rights Under NDPR",
      "rights": [
        "Right to access your personal data",
        "Right to rectification of inaccurate data",
        "Right to erasure ('right to be forgotten')",
        "Right to data portability",
        "Right to object to processing",
        "Right to withdraw consent"
      ],
      "contact": "For data protection inquiries, contact our Data Protection Officer at dpo@newcondo.com"
    }
  }
}
```

### European Union - GDPR

#### Requirements (for EU users)
- Explicit consent (opt-in)
- Right to erasure
- Data portability
- Privacy by design
- DPO appointment (if applicable)
- Cookie consent banner

#### Implementation

```typescript
export const complianceConfigs: Record<string, ComplianceConfig> = {
  'EU': {
    region: 'European Union',
    dataProtectionLaw: 'GDPR',
    consentRequired: true,
    dataLocalization: true, // Some data must stay in EU
    breachNotificationHours: 72,
    minorAge: 16, // Can be 13-16 depending on member state
    cookieConsent: 'opt-in',
  },
};
```

### Regional Consent Management

```typescript
// packages/i18n/src/utils/consent.ts

import { complianceConfigs } from '../config/compliance';

export class ConsentManager {
  private userRegion: string;

  constructor(region: string) {
    this.userRegion = region;
  }

  getComplianceConfig(): ComplianceConfig {
    return complianceConfigs[this.userRegion] || complianceConfigs['NG'];
  }

  requiresExplicitConsent(): boolean {
    const config = this.getComplianceConfig();
    return config.consentRequired;
  }

  getCookieConsentType(): 'opt-in' | 'opt-out' {
    const config = this.getComplianceConfig();
    return config.cookieConsent;
  }

  getMinorAge(): number {
    const config = this.getComplianceConfig();
    return config.minorAge;
  }

  async recordConsent(userId: string, consentType: string): Promise<void> {
    // Record user consent with timestamp and IP
    await prisma.userConsent.create({
      data: {
        userId,
        consentType,
        region: this.userRegion,
        ipAddress: this.getClientIP(),
        userAgent: this.getUserAgent(),
        timestamp: new Date(),
      },
    });
  }
}
```

## Payment Compliance

### Nigeria - CBN Regulations

#### Requirements
- KYC (Know Your Customer) verification
- Transaction limits (₦5M for unverified accounts)
- AML (Anti-Money Laundering) checks
- Virtual account regulations
- Naira transactions must be processed locally

#### Implementation

```typescript
// backend/payment-service/src/utils/compliance.ts

export class PaymentComplianceService {
  async validateNigerianTransaction(
    amount: number,
    userId: string
  ): Promise<{ valid: boolean; reason?: string }> {
    const user = await this.getUserVerificationStatus(userId);

    // Unverified users limited to ₦5,000,000
    if (!user.isVerified && amount > 5000000) {
      return {
        valid: false,
        reason: 'KYC verification required for transactions above ₦5,000,000',
      };
    }

    // Check for suspicious patterns (AML)
    const suspiciousActivity = await this.checkAMLFlags(userId, amount);
    if (suspiciousActivity) {
      return {
        valid: false,
        reason: 'Transaction flagged for review',
      };
    }

    return { valid: true };
  }

  async performKYC(userId: string, documents: KYCDocuments): Promise<void> {
    // Verify documents per CBN requirements
    // - Valid government-issued ID (NIN, BVN, etc.)
    // - Proof of address
    // - Selfie verification
  }
}
```

### ECOWAS - West African Payments

#### Requirements
- Support for XOF (CFA Franc)
- Regional payment methods
- Cross-border transaction compliance
- Local banking integration

```typescript
export const regionalPaymentMethods: Record<string, PaymentMethod[]> = {
  'NG': ['flutterwave', 'paystack', 'bank_transfer', 'card'],
  'GH': ['flutterwave', 'mobile_money', 'bank_transfer', 'card'],
  'CI': ['mobile_money', 'orange_money', 'mtn_money', 'bank_transfer'],
  'KE': ['mpesa', 'airtel_money', 'bank_transfer', 'card'],
};
```

## Tax Compliance

### VAT/Sales Tax

```typescript
// packages/i18n/src/config/tax.ts

export interface TaxConfig {
  region: string;
  vatRate: number;
  vatIncluded: boolean; // Price includes VAT
  taxId Required: boolean;
  taxDisplayName: string;
}

export const taxConfigs: Record<string, TaxConfig> = {
  'NG': {
    region: 'Nigeria',
    vatRate: 0.075, // 7.5%
    vatIncluded: true,
    taxIdRequired: false, // For individuals
    taxDisplayName: 'VAT',
  },
  'GH': {
    region: 'Ghana',
    vatRate: 0.125, // 12.5%
    vatIncluded: true,
    taxIdRequired: false,
    taxDisplayName: 'VAT',
  },
  'KE': {
    region: 'Kenya',
    vatRate: 0.16, // 16%
    vatIncluded: true,
    taxIdRequired: false,
    taxDisplayName: 'VAT',
  },
};

export function calculateTax(
  amount: number,
  region: string
): { tax: number; total: number } {
  const config = taxConfigs[region];
  
  if (!config) {
    return { tax: 0, total: amount };
  }

  if (config.vatIncluded) {
    // Extract VAT from price
    const tax = amount - (amount / (1 + config.vatRate));
    return { tax, total: amount };
  } else {
    // Add VAT to price
    const tax = amount * config.vatRate;
    return { tax, total: amount + tax };
  }
}
```

### Invoice Requirements

```typescript
// backend/payment-service/src/services/invoiceService.ts

export class InvoiceService {
  generateInvoice(payment: Payment, region: string): Invoice {
    const taxConfig = taxConfigs[region];
    const { tax, total } = calculateTax(payment.amount, region);

    return {
      invoiceNumber: this.generateInvoiceNumber(),
      date: new Date(),
      
      // Seller information (Newcondo)
      seller: {
        name: 'Newcondo Technologies Ltd',
        address: this.getCompanyAddress(region),
        taxId: this.getCompanyTaxId(region),
      },
      
      // Buyer information
      buyer: {
        name: payment.user.name,
        email: payment.user.email,
        taxId: payment.user.taxId, // If applicable
      },
      
      // Items
      items: [
        {
          description: payment.description,
          quantity: 1,
          unitPrice: payment.amount,
          taxRate: taxConfig.vatRate,
          tax: tax,
          total: total,
        },
      ],
      
      subtotal: payment.amount,
      tax: tax,
      total: total,
      currency: payment.currency,
      
      // Legal text
      legalNotice: this.getLegalNotice(region),
    };
  }
}
```

## Identity Verification

### Regional ID Requirements

```typescript
// packages/i18n/src/config/verification.ts

export interface VerificationRequirements {
  region: string;
  acceptedIds: IdDocumentType[];
  requiresSelfie: boolean;
  requiresProofOfAddress: boolean;
  biometricVerification: boolean;
  governmentIdApi?: string;
}

export const verificationRequirements: Record<string, VerificationRequirements> = {
  'NG': {
    region: 'Nigeria',
    acceptedIds: ['NIN', 'BVN', 'PASSPORT', 'DRIVERS_LICENSE', 'VOTERS_CARD'],
    requiresSelfie: true,
    requiresProofOfAddress: true,
    biometricVerification: true, // NIN includes biometric
    governmentIdApi: 'NIMC', // Nigerian Identity Management Commission
  },
  'GH': {
    region: 'Ghana',
    acceptedIds: ['GHANA_CARD', 'PASSPORT', 'DRIVERS_LICENSE', 'VOTERS_ID'],
    requiresSelfie: true,
    requiresProofOfAddress: true,
    biometricVerification: true,
    governmentIdApi: 'NIA', // National Identification Authority
  },
  'KE': {
    region: 'Kenya',
    acceptedIds: ['NATIONAL_ID', 'PASSPORT', 'ALIEN_ID'],
    requiresSelfie: true,
    requiresProofOfAddress: false,
    biometricVerification: true,
  },
};
```

## Content Restrictions

### Regional Content Policies

```typescript
// packages/i18n/src/config/content.ts

export interface ContentPolicy {
  region: string;
  prohibitedContent: string[];
  requiredDisclosures: string[];
  languageRequirements: string[];
  advertisingRestrictions: string[];
}

export const contentPolicies: Record<string, ContentPolicy> = {
  'NG': {
    region: 'Nigeria',
    prohibitedContent: [
      'Misleading property information',
      'Discriminatory housing practices',
      'Unlicensed real estate activities',
    ],
    requiredDisclosures: [
      'Property ownership verification',
      'Agent licensing information',
      'All fees and charges',
    ],
    languageRequirements: [
      'English required',
      'Local languages optional',
    ],
    advertisingRestrictions: [
      'No false promises',
      'No guaranteed returns',
      'Clear pricing required',
    ],
  },
};
```

## Age Restrictions

### Minor Protection

```typescript
// packages/i18n/src/utils/age-verification.ts

export function getMinimumAge(region: string): number {
  const config = complianceConfigs[region];
  return config?.minorAge || 18;
}

export function canUserRegister(dateOfBirth: Date, region: string): boolean {
  const minimumAge = getMinimumAge(region);
  const age = calculateAge(dateOfBirth);
  return age >= minimumAge;
}

export function requiresParentalConsent(
  dateOfBirth: Date,
  region: string
): boolean {
  const age = calculateAge(dateOfBirth);
  const adultAge = getMinimumAge(region);
  
  // Some regions allow 16+ with parental consent
  return age >= 16 && age < adultAge;
}
```

## Terms of Service Localization

### Regional Legal Requirements

```typescript
// backend/shared/src/utils/legal.ts

export class LegalDocumentService {
  async getTermsOfService(userId: string, locale: string): Promise<string> {
    const user = await this.getUserWithRegion(userId);
    const region = user.region || this.detectRegion(userId);
    
    // Load region-specific terms
    const terms = await this.loadDocument('terms', locale, region);
    
    // Add region-specific clauses
    const regionalClauses = this.getRegionalClauses(region);
    
    return this.mergeDocuments(terms, regionalClauses);
  }

  private getRegionalClauses(region: string): LegalClauses {
    const clauses: Record<string, LegalClauses> = {
      'NG': {
        jurisdiction: 'Lagos State, Nigeria',
        disputeResolution: 'Arbitration in Lagos',
        governingLaw: 'Laws of the Federal Republic of Nigeria',
        dataProtection: 'Nigerian Data Protection Regulation (NDPR)',
        currency: 'Nigerian Naira (NGN)',
      },
      'GH': {
        jurisdiction: 'Greater Accra, Ghana',
        disputeResolution: 'Ghana Arbitration Centre',
        governingLaw: 'Laws of the Republic of Ghana',
        dataProtection: 'Data Protection Act, 2012 (Act 843)',
        currency: 'Ghanaian Cedi (GHS)',
      },
    };

    return clauses[region] || clauses['NG'];
  }
}
```

## Language Requirements

### Official Language Compliance

```typescript
// packages/i18n/src/config/language-requirements.ts

export interface LanguageRequirement {
  region: string;
  officialLanguages: string[];
  requiredLanguages: string[]; // Must provide
  optionalLanguages: string[]; // Nice to have
  defaultLanguage: string;
}

export const languageRequirements: Record<string, LanguageRequirement> = {
  'NG': {
    region: 'Nigeria',
    officialLanguages: ['en'],
    requiredLanguages: ['en'],
    optionalLanguages: ['yo', 'ig', 'ha', 'pcm'],
    defaultLanguage: 'en',
  },
  'CI': {
    region: 'Côte d\'Ivoire',
    officialLanguages: ['fr'],
    requiredLanguages: ['fr'],
    optionalLanguages: ['en'],
    defaultLanguage: 'fr',
  },
  'CA-QC': {
    region: 'Quebec, Canada',
    officialLanguages: ['fr'],
    requiredLanguages: ['fr', 'en'], // Bilingual requirement
    optionalLanguages: [],
    defaultLanguage: 'fr',
  },
};
```

## Accessibility Compliance

### WCAG Standards

```typescript
// packages/i18n/src/config/accessibility.ts

export interface AccessibilityRequirements {
  region: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  required: boolean;
  screenReaderSupport: boolean;
  keyboardNavigation: boolean;
  colorContrast: number; // Minimum ratio
}

export const accessibilityRequirements: Record<string, AccessibilityRequirements> = {
  'EU': {
    region: 'European Union',
    wcagLevel: 'AA',
    required: true, // European Accessibility Act
    screenReaderSupport: true,
    keyboardNavigation: true,
    colorContrast: 4.5,
  },
  'NG': {
    region: 'Nigeria',
    wcagLevel: 'AA',
    required: false, // Recommended
    screenReaderSupport: true,
    keyboardNavigation: true,
    colorContrast: 4.5,
  },
};
```

## Cookies & Tracking

### Regional Cookie Consent

```typescript
// apps/platform/components/CookieConsent.tsx

import { ConsentManager } from '@newcondo/i18n/utils';
import { useEffect, useState } from 'react';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const consentManager = new ConsentManager(getUserRegion());
  const consentType = consentManager.getCookieConsentType();

  useEffect(() => {
    const hasConsent = localStorage.getItem('cookieConsent');
    
    if (!hasConsent && consentType === 'opt-in') {
      setShowBanner(true);
    }
  }, [consentType]);

  const handleAccept = async (preferences: CookiePreferences) => {
    await consentManager.recordConsent(userId, 'cookies');
    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="cookie-banner">
      {consentType === 'opt-in' ? (
        <OptInBanner onAccept={handleAccept} />
      ) : (
        <OptOutBanner onOptOut={handleOptOut} />
      )}
    </div>
  );
}
```

## Reporting & Compliance Monitoring

### Compliance Dashboard

```typescript
// backend/admin-service/src/services/complianceService.ts

export class ComplianceMonitoringService {
  async generateComplianceReport(region: string): Promise<ComplianceReport> {
    return {
      region,
      date: new Date(),
      metrics: {
        // Data protection
        consentRate: await this.getConsentRate(region),
        dataBreaches: await this.getDataBreaches(region),
        dpoRequests: await this.getDPORequests(region),
        
        // Payment compliance
        kycCompletionRate: await this.getKYCRate(region),
        suspiciousTransactions: await this.getSuspiciousTransactions(region),
        
        // Content compliance
        flaggedContent: await this.getFlaggedContent(region),
        removedListings: await this.getRemovedListings(region),
      },
      issues: await this.getComplianceIssues(region),
      recommendations: this.generateRecommendations(region),
    };
  }

  async checkCompliance(region: string): Promise<ComplianceStatus> {
    const config = complianceConfigs[region];
    const checks = [];

    // Check data protection compliance
    if (config.consentRequired) {
      checks.push(await this.verifyConsentSystem());
    }

    // Check payment compliance
    checks.push(await this.verifyKYCSystem(region));

    // Check content policies
    checks.push(await this.verifyContentModeration(region));

    return {
      compliant: checks.every((check) => check.passed),
      checks,
      lastChecked: new Date(),
    };
  }
}
```

## Testing Compliance

```typescript
// packages/i18n/tests/compliance.test.ts

describe('Regional Compliance', () => {
  describe('Nigeria - NDPR', () => {
    it('requires consent before data collection', async () => {
      const manager = new ConsentManager('NG');
      expect(manager.requiresExplicitConsent()).toBe(true);
    });

    it('enforces transaction limits for unverified users', async () => {
      const service = new PaymentComplianceService();
      const result = await service.validateNigerianTransaction(
        6000000,
        unverifiedUserId
      );
      expect(result.valid).toBe(false);
    });
  });

  describe('EU - GDPR', () => {
    it('provides data export functionality', async () => {
      const data = await exportUserData(userId, 'EU');
      expect(data).toHaveProperty('personalData');
      expect(data).toHaveProperty('processingRecords');
    });
  });
});
```

## Compliance Checklist

### Pre-Launch Checklist

- [ ] Privacy policy translated and localized
- [ ] Terms of service adapted for region
- [ ] Cookie consent implemented correctly
- [ ] Age verification in place
- [ ] Payment limits enforced
- [ ] KYC/verification requirements met
- [ ] Tax calculation correct
- [ ] Invoice generation compliant
- [ ] Data protection measures active
- [ ] Breach notification process ready
- [ ] Content moderation system active
- [ ] Regional payment methods integrated
- [ ] Accessibility standards met
- [ ] Legal review completed
- [ ] Compliance monitoring dashboard ready

## Resources

### Legal Resources
- [NDPR - Nigeria](https://ndpr.nitda.gov.ng/)
- [GDPR - EU](https://gdpr.eu/)
- [Data Protection Act - Ghana](https://www.dataprotection.org.gh/)
- [POPIA - South Africa](https://popia.co.za/)

### Payment Regulations
- [CBN Guidelines - Nigeria](https://www.cbn.gov.ng/)
- [BCEAO - West Africa](https://www.bceao.int/)
- [Bank of Ghana](https://www.bog.gov.gh/)

### Industry Standards
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ISO 27001 - Information Security](https://www.iso.org/isoiec-27001-information-security.html)

## Support

For compliance questions:
- Email: compliance@newcondo.com
- Legal: legal@newcondo.com
- DPO: dpo@newcondo.com