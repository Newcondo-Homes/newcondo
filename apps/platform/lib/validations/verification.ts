// apps/platform/lib/validations/verification.ts
import { z } from 'zod';
import { DocumentType, DocumentSide } from '@newcondo/db';

export const documentUploadSchema = z.object({
  documentType: z.nativeEnum(DocumentType),
  documentSide: z.nativeEnum(DocumentSide).optional(),
  pageNumber: z.number().optional(),
  documentNumber: z.string().optional(),
  file: z.instanceof(File).optional(),
});

export const verificationSubmissionSchema = z.object({
  documents: z.array(documentUploadSchema).min(1, "At least one document is required"),
  selfie: z.instanceof(File, { message: "Selfie is required" }),
});

export const documentNumberSchema = z.object({
  documentType: z.nativeEnum(DocumentType),
  documentNumber: z.string().min(1, "Document number is required"),
});

export const reVerificationSchema = z.object({
  rejectedDocumentIds: z.array(z.string()).min(1, "Select documents to re-verify"),
  documents: z.array(documentUploadSchema).min(1, "Upload replacement documents"),
});

export type DocumentUpload = z.infer<typeof documentUploadSchema>;
export type VerificationSubmission = z.infer<typeof verificationSubmissionSchema>;
export type DocumentNumber = z.infer<typeof documentNumberSchema>;
export type ReVerification = z.infer<typeof reVerificationSchema>;