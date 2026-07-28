// backend/payment-service/src/types/receipt.ts

export interface ReceiptData {
  id: string;
  receiptNumber: string;
  paymentId: string;
  transactionRef: string;
  flutterwaveRef?: string;
  
  // Payment Details
  amount: number;
  currency: string;
  paymentType: 'RENT' | 'DEPOSIT' | 'PROPERTY_MARKING' | 'PREMIUM_UPGRADE';
  paymentMethod: string;
  paidAt: Date;
  description?: string;

  // Payer Information
  payer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };

  // Property Information (if applicable)
  property?: {
    id: string;
    title: string;
    address: string;
    city: string;
    state: string;
    unitNumber?: string;
  };

  // Owner/Agent Information
  recipient?: {
    id: string;
    name: string;
    email: string;
    type: 'OWNER' | 'AGENT';
  };

  // Fee Breakdown
  feeBreakdown?: {
    subtotal: number;
    platformFee: number;
    processingFee: number;
    agentCommission?: number;
    total: number;
  };

  // Company Information
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    logo?: string;
    taxId?: string;
  };

  // Receipt Metadata
  status: 'GENERATED' | 'SENT' | 'VIEWED' | 'DOWNLOADED';
  format: 'PDF' | 'HTML' | 'EMAIL';
  generatedAt: Date;
  sentAt?: Date;
  viewedAt?: Date;
  downloadedAt?: Date;
}

export interface ReceiptGenerationRequest {
  paymentId: string;
  format: 'PDF' | 'HTML' | 'EMAIL';
  sendToEmail?: boolean;
  emailRecipients?: string[];
  includeCompanyLogo?: boolean;
  customMessage?: string;
  language?: 'en' | 'fr' | 'sw'; // English, French, Swahili for African markets
}

export interface ReceiptTemplate {
  id: string;
  name: string;
  type: 'RENT' | 'DEPOSIT' | 'PROPERTY_MARKING' | 'PREMIUM_UPGRADE' | 'GENERAL';
  version: string;
  htmlTemplate: string;
  cssStyles: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReceiptEmail {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  htmlContent: string;
  textContent: string;
  attachments: {
    filename: string;
    content: Buffer;
    contentType: string;
  }[];
}

export interface ReceiptSettings {
  id: string;
  userId: string;
  autoGenerate: boolean;
  autoSendEmail: boolean;
  includeQrCode: boolean;
  includeFeeBreakdown: boolean;
  includePropertyDetails: boolean;
  customFooterText?: string;
  preferredFormat: 'PDF' | 'HTML';
  emailTemplate: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BulkReceiptGeneration {
  batchId: string;
  paymentIds: string[];
  format: 'PDF' | 'HTML' | 'EMAIL';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalCount: number;
  successCount: number;
  failedCount: number;
  results: {
    success: {
      paymentId: string;
      receiptId: string;
      url: string;
    }[];
    failed: {
      paymentId: string;
      error: string;
    }[];
  };
  createdAt: Date;
  completedAt?: Date;
}

export interface ReceiptAnalytics {
  totalGenerated: number;
  totalSent: number;
  totalViewed: number;
  totalDownloaded: number;
  byFormat: Record<string, number>;
  byPaymentType: Record<string, number>;
  averageViewTime: number;
  monthlyStats: {
    month: string;
    generated: number;
    sent: number;
    viewed: number;
    downloaded: number;
  }[];
}

export interface ReceiptValidation {
  receiptId: string;
  receiptNumber: string;
  isValid: boolean;
  paymentExists: boolean;
  amountMatches: boolean;
  dateMatches: boolean;
  signatureValid: boolean;
  validationCode: string;
  validatedAt: Date;
}

export interface ReceiptArchive {
  id: string;
  userId: string;
  year: number;
  month?: number;
  receipts: {
    receiptId: string;
    receiptNumber: string;
    paymentId: string;
    amount: number;
    currency: string;
    paymentType: string;
    paidAt: Date;
    url: string;
  }[];
  archiveUrl: string; // ZIP file containing all receipts
  generatedAt: Date;
}

export interface ReceiptCustomization {
  userId: string;
  companyLogo?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  customColors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
  };
  customFonts: {
    heading: string;
    body: string;
  };
  showQrCode: boolean;
  showWatermark: boolean;
  watermarkText?: string;
  footerText?: string;
  socialLinks?: {
    website?: string;
    twitter?: string;
    linkedin?: string;
    facebook?: string;
  };
}