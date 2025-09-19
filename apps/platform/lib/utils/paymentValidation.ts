import { z } from "zod";

// Validation schemas for different payment scenarios
export const paymentFormSchema = z.object({
  amount: z
    .number()
    .min(1000, "Minimum payment amount is ₦1,000")
    .max(10000000, "Maximum payment amount is ₦10,000,000"),
  currency: z.enum(["NGN", "USD"]).default("NGN"),
  paymentMethod: z.enum(["card", "bank_transfer", "ussd", "mobile_money"]),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .regex(/^(\+234|234|0)[789][01]\d{8}$/, "Invalid Nigerian phone number"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
});

export const rentPaymentSchema = paymentFormSchema.extend({
  propertyId: z.string().min(1, "Property ID is required"),
  unitId: z.string().optional(),
  paymentType: z.enum(["RENT", "DEPOSIT"]),
  duration: z.number().min(1, "Rental duration must be at least 1 month").max(24, "Maximum 24 months"),
});

export const markingPaymentSchema = paymentFormSchema.extend({
  markingJobId: z.string().min(1, "Marking job ID is required"),
  paymentType: z.literal("PROPERTY_MARKING"),
});

// Card validation
export const cardValidationSchema = z.object({
  cardNumber: z
    .string()
    .regex(/^\d{16}$/, "Card number must be 16 digits")
    .refine(validateLuhn, "Invalid card number"),
  expiryMonth: z
    .number()
    .min(1, "Invalid month")
    .max(12, "Invalid month"),
  expiryYear: z
    .number()
    .min(new Date().getFullYear(), "Card has expired")
    .max(new Date().getFullYear() + 20, "Invalid expiry year"),
  cvv: z
    .string()
    .regex(/^\d{3,4}$/, "CVV must be 3 or 4 digits"),
  pin: z
    .string()
    .regex(/^\d{4}$/, "PIN must be 4 digits")
    .optional(),
});

// Bank account validation
export const bankAccountSchema = z.object({
  accountNumber: z
    .string()
    .regex(/^\d{10}$/, "Account number must be 10 digits"),
  bankCode: z
    .string()
    .min(3, "Bank code is required"),
});

// USSD validation
export const ussdSchema = z.object({
  accountNumber: z
    .string()
    .regex(/^\d{10}$/, "Account number must be 10 digits"),
  bankCode: z.string().min(3, "Bank code is required"),
});

// Types
export type PaymentFormData = z.infer<typeof paymentFormSchema>;
export type RentPaymentData = z.infer<typeof rentPaymentSchema>;
export type MarkingPaymentData = z.infer<typeof markingPaymentSchema>;
export type CardValidationData = z.infer<typeof cardValidationSchema>;
export type BankAccountData = z.infer<typeof bankAccountSchema>;
export type USSDData = z.infer<typeof ussdSchema>;

// Utility functions
export function validateLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  let sum = 0;
  let isEven = false;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

export function getCardType(cardNumber: string): string {
  const number = cardNumber.replace(/\D/g, '');
  
  if (/^4/.test(number)) return 'visa';
  if (/^5[1-5]/.test(number)) return 'mastercard';
  if (/^3[47]/.test(number)) return 'amex';
  if (/^6(?:011|5)/.test(number)) return 'discover';
  if (/^506[01]|^6506|^6516|^65/.test(number)) return 'verve';
  
  return 'unknown';
}

export function formatCardNumber(value: string): string {
  const cleanValue = value.replace(/\D/g, '');
  const cardType = getCardType(cleanValue);
  
  if (cardType === 'amex') {
    return cleanValue.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
  }
  
  return cleanValue.replace(/(\d{4})/g, '$1 ').trim();
}

export function formatExpiryDate(value: string): string {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length >= 2) {
    return `${cleanValue.slice(0, 2)}/${cleanValue.slice(2, 4)}`;
  }
  return cleanValue;
}

export function validateAmount(amount: number, currency: string = 'NGN'): {
  isValid: boolean;
  error?: string;
} {
  const minAmounts = {
    NGN: 100,
    USD: 1,
  };
  
  const maxAmounts = {
    NGN: 10000000,
    USD: 50000,
  };
  
  const min = minAmounts[currency as keyof typeof minAmounts];
  const max = maxAmounts[currency as keyof typeof maxAmounts];
  
  if (amount < min) {
    return {
      isValid: false,
      error: `Minimum amount is ${currency === 'NGN' ? '₦' : '$'}${min.toLocaleString()}`,
    };
  }
  
  if (amount > max) {
    return {
      isValid: false,
      error: `Maximum amount is ${currency === 'NGN' ? '₦' : '$'}${max.toLocaleString()}`,
    };
  }
  
  return { isValid: true };
}

export function validatePhoneNumber(phone: string): {
  isValid: boolean;
  formatted?: string;
  error?: string;
} {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Nigerian phone number patterns
  const patterns = [
    /^234[789][01]\d{8}$/, // +234 format
    /^[789][01]\d{8}$/, // Local format without 0
    /^0[789][01]\d{8}$/, // Local format with 0
  ];
  
  let formatted: string;
  
  if (patterns[0].test(cleaned)) {
    // Already in +234 format
    formatted = `+${cleaned}`;
  } else if (patterns[1].test(cleaned)) {
    // Local without 0, add +234
    formatted = `+234${cleaned}`;
  } else if (patterns[2].test(cleaned)) {
    // Local with 0, replace 0 with +234
    formatted = `+234${cleaned.substring(1)}`;
  } else {
    return {
      isValid: false,
      error: 'Invalid Nigerian phone number format',
    };
  }
  
  return {
    isValid: true,
    formatted,
  };
}

// Payment method availability check
export function isPaymentMethodAvailable(
  method: string,
  amount: number,
  currency: string = 'NGN'
): boolean {
  const methodLimits = {
    card: { min: 100, max: 10000000 },
    bank_transfer: { min: 1000, max: 10000000 },
    ussd: { min: 100, max: 1000000 },
    mobile_money: { min: 100, max: 500000 },
  };
  
  const limits = methodLimits[method as keyof typeof methodLimits];
  if (!limits) return false;
  
  return amount >= limits.min && amount <= limits.max;
}

// Fee calculation
export function calculatePaymentFee(
  amount: number,
  method: string,
  currency: string = 'NGN'
): number {
  const feeRates = {
    card: 0.015, // 1.5%
    bank_transfer: 50, // Flat ₦50
    ussd: 0.01, // 1%
    mobile_money: 0.01, // 1%
  };
  
  const rate = feeRates[method as keyof typeof feeRates];
  if (typeof rate === 'number') {
    if (method === 'bank_transfer') {
      return rate; // Flat fee
    }
    return Math.round(amount * rate); // Percentage fee
  }
  
  return 0;
}

export function getTotalAmount(
  amount: number,
  method: string,
  currency: string = 'NGN'
): number {
  const fee = calculatePaymentFee(amount, method, currency);
  return amount + fee;
}