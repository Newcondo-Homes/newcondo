// apps/admin/src/lib/validations/documentVerification.ts

import { z } from 'zod'

export const documentVerificationStatusSchema = z.enum([
  'PENDING',
  'APPROVED', 
  'REJECTED',
  'EXPIRED'
])

export const documentVerificationSchema = z.object({
  documentId: z.string().cuid('Invalid document ID'),
  status: documentVerificationStatusSchema,
  verificationNotes: z
    .string()
    .max(1000, 'Verification notes must be less than 1000 characters')
    .optional(),
  rejectionReason: z
    .string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(500, 'Rejection reason must be less than 500 characters')
    .optional(),
  verifiedBy: z.string().cuid('Invalid verifier ID'),
})

export const bulkDocumentVerificationSchema = z.object({
  documentIds: z
    .array(z.string().cuid('Invalid document ID'))
    .min(1, 'At least one document ID is required')
    .max(50, 'Cannot verify more than 50 documents at once'),
  status: documentVerificationStatusSchema,
  verificationNotes: z
    .string()
    .max(1000, 'Verification notes must be less than 1000 characters')
    .optional(),
  rejectionReason: z
    .string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(500, 'Rejection reason must be less than 500 characters')
    .optional(),
})

export const documentSearchSchema = z.object({
  query: z
    .string()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query must be less than 100 characters')
    .optional(),
  documentType: z
    .enum([
      'NIN',
      'BVN', 
      'PASSPORT',
      'VOTERS_CARD',
      'DRIVERS_LICENSE',
      'SELFIE',
      'OWNERSHIP_DOCUMENT',
      'CONSENT_DOCUMENT',
      'UNDERTAKING_DOCUMENT',
      'BUSINESS_REGISTRATION',
      'TAX_CERTIFICATE',
      'UTILITY_BILL',
      'BANK_STATEMENT',
      'OTHER'
    ])
    .optional(),
  status: documentVerificationStatusSchema.optional(),
  userId: z.string().cuid('Invalid user ID').optional(),
  propertyId: z.string().cuid('Invalid property ID').optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'documentType', 'status'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Refinement to ensure dateTo is after dateFrom
.refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      return data.dateTo >= data.dateFrom
    }
    return true
  },
  {
    message: 'End date must be after start date',
    path: ['dateTo'],
  }
)

export const documentComplianceCheckSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  propertyId: z.string().cuid('Invalid property ID').optional(),
  checkType: z.enum([
    'USER_IDENTITY',
    'PROPERTY_OWNERSHIP', 
    'AGENT_AUTHORIZATION',
    'BUSINESS_REGISTRATION',
    'COMPLETE_PROFILE'
  ]),
  includeExpired: z.boolean().default(false),
})

export const documentExpiryReminderSchema = z.object({
  documentIds: z
    .array(z.string().cuid('Invalid document ID'))
    .min(1, 'At least one document ID is required'),
  reminderDays: z
    .number()
    .min(1, 'Reminder days must be at least 1')
    .max(365, 'Reminder days cannot exceed 365'),
  message: z
    .string()
    .min(10, 'Reminder message must be at least 10 characters')
    .max(500, 'Reminder message must be less than 500 characters')
    .optional(),
})

export const adminDocumentActionSchema = z.object({
  action: z.enum([
    'APPROVE',
    'REJECT', 
    'REQUEST_REUPLOAD',
    'MARK_EXPIRED',
    'SEND_REMINDER',
    'ADD_NOTE'
  ]),
  documentId: z.string().cuid('Invalid document ID'),
  reason: z
    .string()
    .min(5, 'Action reason must be at least 5 characters')
    .max(1000, 'Action reason must be less than 1000 characters')
    .optional(),
  adminId: z.string().cuid('Invalid admin ID'),
  metadata: z.record(z.unknown()).optional(),
})

// Type exports
export type DocumentVerificationStatus = z.infer<typeof documentVerificationStatusSchema>
export type DocumentVerification = z.infer<typeof documentVerificationSchema>
export type BulkDocumentVerification = z.infer<typeof bulkDocumentVerificationSchema>
export type DocumentSearch = z.infer<typeof documentSearchSchema>
export type DocumentComplianceCheck = z.infer<typeof documentComplianceCheckSchema>
export type DocumentExpiryReminder = z.infer<typeof documentExpiryReminderSchema>
export type AdminDocumentAction = z.infer<typeof adminDocumentActionSchema>