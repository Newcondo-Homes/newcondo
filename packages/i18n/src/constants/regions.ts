/**
 * Regional Constants and Data
 * Location: packages/i18n/src/constants/regions.ts
 */

import type { 
  RegionalSettings, 
  LocaleInfo, 
  CurrencyInfo,
  NigerianState,
  NigerianRegion,
  SupportedLocale,
  SupportedCurrency
} from '../types';

// Supported locales configuration
export const SUPPORTED_LOCALES: LocaleInfo[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    flag: '🇬🇧',
    enabled: true
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    flag: '🇫🇷',
    enabled: true
  },
  {
    code: 'pcm',
    name: 'Nigerian Pidgin',
    nativeName: 'Naija Pidgin',
    direction: 'ltr',
    flag: '🇳🇬',
    enabled: true
  }
];

// Default locale
export const DEFAULT_LOCALE: SupportedLocale = 'en';
export const FALLBACK_LOCALE: SupportedLocale = 'en';

// Supported currencies
export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  {
    code: 'NGN',
    name: 'Nigerian Naira',
    symbol: '₦',
    symbolNative: '₦',
    decimalDigits: 2,
    rounding: 0,
    nameTranslations: {
      en: 'Nigerian Naira',
      fr: 'Naira nigérian',
      pcm: 'Naija Naira'
    }
  },
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    symbolNative: '$',
    decimalDigits: 2,
    rounding: 0,
    nameTranslations: {
      en: 'US Dollar',
      fr: 'Dollar américain',
      pcm: 'American Dollar'
    }
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    symbolNative: '€',
    decimalDigits: 2,
    rounding: 0,
    nameTranslations: {
      en: 'Euro',
      fr: 'Euro',
      pcm: 'Euro'
    }
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    symbolNative: '£',
    decimalDigits: 2,
    rounding: 0,
    nameTranslations: {
      en: 'British Pound',
      fr: 'Livre sterling',
      pcm: 'British Pound'
    }
  },
  {
    code: 'XAF',
    name: 'Central African CFA Franc',
    symbol: 'FCFA',
    symbolNative: 'FCFA',
    decimalDigits: 0,
    rounding: 0,
    nameTranslations: {
      en: 'Central African CFA Franc',
      fr: 'Franc CFA',
      pcm: 'CFA Franc'
    }
  }
];

// Default currency
export const DEFAULT_CURRENCY: SupportedCurrency = 'NGN';

// Regional settings by country
export const REGIONAL_SETTINGS: Record<string, RegionalSettings> = {
  NG: {
    region: 'Africa',
    country: 'Nigeria',
    countryCode: 'NG',
    phonePrefix: '+234',
    locale: 'en',
    currency: 'NGN',
    supportedPaymentMethods: ['card', 'bank_transfer', 'ussd', 'mobile_money']
  },
  FR: {
    region: 'Europe',
    country: 'France',
    countryCode: 'FR',
    phonePrefix: '+33',
    locale: 'fr',
    currency: 'EUR',
    supportedPaymentMethods: ['card', 'bank_transfer']
  },
  CM: {
    region: 'Africa',
    country: 'Cameroon',
    countryCode: 'CM',
    phonePrefix: '+237',
    locale: 'fr',
    currency: 'XAF',
    supportedPaymentMethods: ['mobile_money', 'card']
  },
  US: {
    region: 'Americas',
    country: 'United States',
    countryCode: 'US',
    phonePrefix: '+1',
    locale: 'en',
    currency: 'USD',
    supportedPaymentMethods: ['card', 'bank_transfer']
  },
  GB: {
    region: 'Europe',
    country: 'United Kingdom',
    countryCode: 'GB',
    phonePrefix: '+44',
    locale: 'en',
    currency: 'GBP',
    supportedPaymentMethods: ['card', 'bank_transfer']
  }
};

// Nigerian states data
export const NIGERIAN_STATES: NigerianState[] = [
  {
    code: 'AB',
    name: 'Abia',
    capital: 'Umuahia',
    region: 'South East',
    lgas: ['Aba North', 'Aba South', 'Arochukwu', 'Bende', 'Ikwuano', 'Isiala Ngwa North', 'Isiala Ngwa South', 'Isuikwuato', 'Obi Ngwa', 'Ohafia', 'Osisioma', 'Ugwunagbo', 'Ukwa East', 'Ukwa West', 'Umuahia North', 'Umuahia South', 'Umu Nneochi']
  },
  {
    code: 'AD',
    name: 'Adamawa',
    capital: 'Yola',
    region: 'North East',
    lgas: ['Demsa', 'Fufure', 'Ganye', 'Gayuk', 'Gombi', 'Grie', 'Hong', 'Jada', 'Lamurde', 'Madagali', 'Maiha', 'Mayo Belwa', 'Michika', 'Mubi North', 'Mubi South', 'Numan', 'Shelleng', 'Song', 'Toungo', 'Yola North', 'Yola South']
  },
  {
    code: 'AK',
    name: 'Akwa Ibom',
    capital: 'Uyo',
    region: 'South South',
    lgas: ['Abak', 'Eastern Obolo', 'Eket', 'Esit Eket', 'Essien Udim', 'Etim Ekpo', 'Etinan', 'Ibeno', 'Ibesikpo Asutan', 'Ibiono-Ibom', 'Ika', 'Ikono', 'Ikot Abasi', 'Ikot Ekpene', 'Ini', 'Itu', 'Mbo', 'Mkpat-Enin', 'Nsit-Atai', 'Nsit-Ibom', 'Nsit-Ubium', 'Obot Akara', 'Okobo', 'Onna', 'Oron', 'Oruk Anam', 'Udung-Uko', 'Ukanafun', 'Uruan', 'Urue-Offong/Oruko', 'Uyo']
  },
  {
    code: 'AN',
    name: 'Anambra',
    capital: 'Awka',
    region: 'South East',
    lgas: ['Aguata', 'Anambra East', 'Anambra West', 'Anaocha', 'Awka North', 'Awka South', 'Ayamelum', 'Dunukofia', 'Ekwusigo', 'Idemili North', 'Idemili South', 'Ihiala', 'Njikoka', 'Nnewi North', 'Nnewi South', 'Ogbaru', 'Onitsha North', 'Onitsha South', 'Orumba North', 'Orumba South', 'Oyi']
  },
  {
    code: 'LA',
    name: 'Lagos',
    capital: 'Ikeja',
    region: 'South West',
    lgas: ['Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa', 'Badagry', 'Epe', 'Eti Osa', 'Ibeju-Lekki', 'Ifako-Ijaiye', 'Ikeja', 'Ikorodu', 'Kosofe', 'Lagos Island', 'Lagos Mainland', 'Mushin', 'Ojo', 'Oshodi-Isolo', 'Shomolu', 'Surulere']
  }
  // Add more states as needed
];

// Nigerian regions
export const NIGERIAN_REGIONS: NigerianRegion[] = [
  'North Central',
  'North East',
  'North West',
  'South East',
  'South South',
  'South West'
];

// Timezone mappings
export const TIMEZONE_MAP: Record<string, string> = {
  NG: 'Africa/Lagos',
  FR: 'Europe/Paris',
  CM: 'Africa/Douala',
  US: 'America/New_York',
  GB: 'Europe/London'
};

// RTL languages (for future expansion)
export const RTL_LOCALES: SupportedLocale[] = [];

// Locale to country mapping
export const LOCALE_TO_COUNTRY: Record<SupportedLocale, string[]> = {
  en: ['NG', 'US', 'GB', 'GH', 'KE'],
  fr: ['FR', 'CM', 'SN', 'CI', 'BJ'],
  pcm: ['NG']
};

// Currency to locale mapping
export const CURRENCY_TO_LOCALE: Record<SupportedCurrency, SupportedLocale> = {
  NGN: 'en',
  USD: 'en',
  EUR: 'fr',
  GBP: 'en',
  XAF: 'fr'
};

// Default date formats by locale
export const DEFAULT_DATE_FORMATS: Record<SupportedLocale, string> = {
  en: 'DD/MM/YYYY',
  fr: 'DD/MM/YYYY',
  pcm: 'DD/MM/YYYY'
};

// Default time formats by locale
export const DEFAULT_TIME_FORMATS: Record<SupportedLocale, '12h' | '24h'> = {
  en: '12h',
  fr: '24h',
  pcm: '12h'
};

// Phone number formats by country
export const PHONE_FORMATS: Record<string, string> = {
  NG: '+234 XXX XXX XXXX',
  FR: '+33 X XX XX XX XX',
  CM: '+237 X XX XX XX XX',
  US: '+1 (XXX) XXX-XXXX',
  GB: '+44 XXXX XXXXXX'
};

// Get regional settings by country code
export function getRegionalSettings(countryCode: string): RegionalSettings | null {
  return REGIONAL_SETTINGS[countryCode] || null;
}

// Get currency info by code
export function getCurrencyInfo(code: SupportedCurrency): CurrencyInfo | undefined {
  return SUPPORTED_CURRENCIES.find(c => c.code === code);
}

// Get locale info by code
export function getLocaleInfo(code: SupportedLocale): LocaleInfo | undefined {
  return SUPPORTED_LOCALES.find(l => l.code === code);
}

// Check if locale is RTL
export function isRTL(locale: SupportedLocale): boolean {
  return RTL_LOCALES.includes(locale);
}

// Get Nigerian state by code
export function getNigerianState(code: string): NigerianState | undefined {
  return NIGERIAN_STATES.find(s => s.code === code);
}

// Get Nigerian states by region
export function getStatesByRegion(region: NigerianRegion): NigerianState[] {
  return NIGERIAN_STATES.filter(s => s.region === region);
}