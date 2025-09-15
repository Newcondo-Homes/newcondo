// apps/admin/src/lib/validations/documentTemplate.ts

import { z } from 'zod'

export const documentTemplateTypeSchema = z.enum([
  'CONSENT_DOCUMENT',
  'UNDERTAKING_DOCUMENT',
  'OWNERSHIP_PROOF',
  'AGENT_AUTHORIZATION',
  'RENTAL_AGREEMENT',
  'PROPERTY_INSPECTION',
  'MAINTENANCE_AGREEMENT',
  'LEGAL_NOTICE',
  'TERMS_CONDITIONS',
  'PRIVACY_POLICY',
  'CUSTOM'
])

export const templateStatusSchema = z.enum([
  'DRAFT',
  'ACTIVE',
  'INACTIVE',
  'ARCHIVED'
])

export const templateVariableSchema = z.object({
  key: z
    .string()
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Variable key must be a valid identifier')
    .min(1, 'Variable key is required')
    .max(50, 'Variable key must be less than 50 characters'),
  label: z
    .string()
    .min(1, 'Variable label is required')
    .max(100, 'Variable label must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Variable description must be less than 500 characters')
    .optional(),
  type: z.enum(['text', 'number', 'date', 'boolean', 'email', 'phone', 'address']),
  required: z.boolean().default(false),
  defaultValue: z.string().optional(),
  validation: z
    .object({
      minLength: z.number().min(0).optional(),
      maxLength: z.number().min(0).optional(),
      pattern: z.string().optional(),
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
})

export const documentTemplateSchema = z.object({
  name: z
    .string()
    .min(3, 'Template name must be at least 3 characters')
    .max(100, 'Template name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Template description must be less than 500 characters')
    .optional(),
  type: documentTemplateTypeSchema,
  category: z
    .string()
    .min(2, 'Category must be at least 2 characters')
    .max(50, 'Category must be less than 50 characters')
    .optional(),
  content: z
    .string()
    .min(50, 'Template content must be at least 50 characters')
    .max(50000, 'Template content must be less than 50,000 characters'),
  variables: z
    .array(templateVariableSchema)
    .max(50, 'Cannot have more than 50 variables per template'),
  status: templateStatusSchema.default('DRAFT'),
  isSystem: z.boolean().default(false), // System templates cannot be deleted
  requiresSignature: z.boolean().default(false),
  signatureFields: z
    .array(
      z.object({
        id: z.string().min(1, 'Signature field ID is required'),
        label: z.string().min(1, 'Signature field label is required'),
        required: z.boolean().default(true),
        signerRole: z.enum(['USER', 'PROPERTY_OWNER', 'AGENT', 'ADMIN']),
        position: z
          .object({
            page: z.number().min(1),
            x: z.number().min(0).max(100), // Percentage
            y: z.number().min(0).max(100), // Percentage
          })
          .optional(),
      })
    )
    .optional(),
  legalCompliance: z
    .object({
      jurisdiction: z
        .string()
        .min(2, 'Jurisdiction must be at least 2 characters')
        .max(50, 'Jurisdiction must be less than 50 characters')
        .default('Nigeria'),
      regulatoryFramework: z
        .array(z.string())
        .max(10, 'Cannot specify more than 10 regulatory frameworks'),
      complianceNotes: z
        .string()
        .max(1000, 'Compliance notes must be less than 1000 characters')
        .optional(),
      lastReviewed: z.coerce.date().optional(),
      nextReviewDate: z.coerce.date().optional(),
    })
    .optional(),
  metadata: z.record(z.unknown()).optional(),
})

export const updateDocumentTemplateSchema = documentTemplateSchema
  .partial()
  .extend({
    id: z.string().cuid('Invalid template ID'),
  })

export const templatePreviewSchema = z.object({
  templateId: z.string().cuid('Invalid template ID'),
  variableValues: z.record(z.string(), z.unknown()),
  format: z.enum(['html', 'pdf', 'docx']).default('html'),
})

export const templateBulkActionSchema = z.object({
  templateIds: z
    .array(z.string().cuid('Invalid template ID'))
    .min(1, 'At least one template ID is required')
    .max(20, 'Cannot perform bulk action on more than 20 templates'),
  action: z.enum([
    'ACTIVATE',
    'DEACTIVATE',
    'ARCHIVE',
    'DELETE',
    'DUPLICATE',
    'EXPORT'
  ]),
  metadata: z.record(z.unknown()).optional(),
})

export const templateSearchSchema = z.object({
  query: z
    .string()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query must be less than 100 characters')
    .optional(),
  type: documentTemplateTypeSchema.optional(),
  status: templateStatusSchema.optional(),
  category: z.string().max(50, 'Category must be less than 50 characters').optional(),
  isSystem: z.boolean().optional(),
  requiresSignature: z.boolean().optional(),
  createdBy: z.string().cuid('Invalid creator ID').optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'name', 'type', 'status'])
    .default('updatedAt'),
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

export const templateVersionSchema = z.object({
  templateId: z.string().cuid('Invalid template ID'),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, 'Version must follow semver format (e.g., 1.0.0)')
    .min(5, 'Version must be at least 5 characters')
    .max(20, 'Version must be less than 20 characters'),
  changelog: z
    .string()
    .min(10, 'Changelog must be at least 10 characters')
    .max(2000, 'Changelog must be less than 2000 characters'),
  isActive: z.boolean().default(false),
})

export const templateAccessControlSchema = z.object({
  templateId: z.string().cuid('Invalid template ID'),
  permissions: z.object({
    view: z.array(z.enum(['ADMIN', 'PROPERTY_MANAGER', 'AGENT', 'USER'])),
    edit: z.array(z.enum(['ADMIN', 'PROPERTY_MANAGER'])),
    delete: z.array(z.enum(['ADMIN'])),
    use: z.array(z.enum(['ADMIN', 'PROPERTY_MANAGER', 'AGENT', 'USER'])),
  }),
  restrictions: z
    .object({
      maxUsesPerUser: z.number().min(1).optional(),
      maxUsesPerProperty: z.number().min(1).optional(),
      validUntil: z.coerce.date().optional(),
      allowedRegions: z.array(z.string()).optional(),
    })
    .optional(),
})

export const digitalSignatureConfigSchema = z.object({
  enabled: z.boolean().default(false),
  provider: z.enum(['DOCUSIGN', 'ADOBE_SIGN', 'INTERNAL']).optional(),
  settings: z
    .object({
      requireEmailVerification: z.boolean().default(true),
      requirePhoneVerification: z.boolean().default(false),
      allowBulkSigning: z.boolean().default(false),
      retentionPeriod: z.number().min(30).max(3650).default(365), // Days
      auditTrail: z.boolean().default(true),
    })
    .optional(),
})

// Type exports
export type DocumentTemplateType = z.infer<typeof documentTemplateTypeSchema>
export type TemplateStatus = z.infer<typeof templateStatusSchema>
export type TemplateVariable = z.infer<typeof templateVariableSchema>
export type DocumentTemplate = z.infer<typeof documentTemplateSchema>
export type UpdateDocumentTemplate = z.infer<typeof updateDocumentTemplateSchema>
export type TemplatePreview = z.infer<typeof templatePreviewSchema>
export type TemplateBulkAction = z.infer<typeof templateBulkActionSchema>
export type TemplateSearch = z.infer<typeof templateSearchSchema>
export type TemplateVersion = z.infer<typeof templateVersionSchema>
export type TemplateAccessControl = z.infer<typeof templateAccessControlSchema>
export type DigitalSignatureConfig = z.infer<typeof digitalSignatureConfigSchema>