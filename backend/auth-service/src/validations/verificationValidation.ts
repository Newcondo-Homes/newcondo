import { Request, Response, NextFunction } from "express";
import { z } from "zod";

// Verification validation schemas
const verifyEmailSchema = z.object({
  body: z.object({
    code: z
      .string()
      .min(6, "Verification code must be 6 digits")
      .max(6, "Verification code must be 6 digits")
      .regex(/^\d{6}$/, "Verification code must contain only numbers"),
  }),
});

const uploadDocumentsSchema = z.object({
  body: z.object({
    documentType: z.enum(
      ["passport", "national_id", "drivers_license", "voters_card"],
      {
        required_error: "Document type is required",
        invalid_type_error: "Invalid document type",
      }
    ),
    documentNumber: z
      .string()
      .min(5, "Document number must be at least 5 characters")
      .max(50, "Document number must not exceed 50 characters")
      .regex(
        /^[a-zA-Z0-9\-_]+$/,
        "Document number contains invalid characters"
      ),
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must not exceed 50 characters")
      .regex(/^[a-zA-Z\s\-']+$/, "First name contains invalid characters"),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must not exceed 50 characters")
      .regex(/^[a-zA-Z\s\-']+$/, "Last name contains invalid characters"),
    dateOfBirth: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Date of birth must be in YYYY-MM-DD format"
      )
      .refine((date) => {
        const birthDate = new Date(date);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        return age >= 18 && age <= 120;
      }, "You must be at least 18 years old"),
    gender: z
      .enum(["male", "female", "other"], {
        required_error: "Gender is required",
        invalid_type_error: "Invalid gender selection",
      })
      .optional(),
    address: z
      .string()
      .min(10, "Address must be at least 10 characters")
      .max(200, "Address must not exceed 200 characters")
      .optional(),
    frontImageUrl: z
      .string()
      .url("Invalid front image URL")
      .min(1, "Front image is required"),
    backImageUrl: z.string().url("Invalid back image URL").optional(),
    additionalNotes: z
      .string()
      .max(500, "Additional notes must not exceed 500 characters")
      .optional(),
  }),
});

const resubmitDocumentsSchema = z.object({
  body: z.object({
    documentType: z.enum(
      ["passport", "national_id", "drivers_license", "voters_card"],
      {
        required_error: "Document type is required",
        invalid_type_error: "Invalid document type",
      }
    ),
    documentNumber: z
      .string()
      .min(5, "Document number must be at least 5 characters")
      .max(50, "Document number must not exceed 50 characters")
      .regex(
        /^[a-zA-Z0-9\-_]+$/,
        "Document number contains invalid characters"
      ),
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must not exceed 50 characters")
      .regex(/^[a-zA-Z\s\-']+$/, "First name contains invalid characters"),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must not exceed 50 characters")
      .regex(/^[a-zA-Z\s\-']+$/, "Last name contains invalid characters"),
    dateOfBirth: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Date of birth must be in YYYY-MM-DD format"
      )
      .refine((date) => {
        const birthDate = new Date(date);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        return age >= 18 && age <= 120;
      }, "You must be at least 18 years old"),
    gender: z
      .enum(["male", "female", "other"], {
        required_error: "Gender is required",
        invalid_type_error: "Invalid gender selection",
      })
      .optional(),
    address: z
      .string()
      .min(10, "Address must be at least 10 characters")
      .max(200, "Address must not exceed 200 characters")
      .optional(),
    frontImageUrl: z
      .string()
      .url("Invalid front image URL")
      .min(1, "Front image is required"),
    backImageUrl: z.string().url("Invalid back image URL").optional(),
    additionalNotes: z
      .string()
      .max(500, "Additional notes must not exceed 500 characters")
      .optional(),
    rejectionReason: z
      .string()
      .min(1, "Rejection reason is required for resubmission")
      .max(1000, "Rejection reason must not exceed 1000 characters")
      .optional(),
  }),
});

const verifyPhoneSchema = z.object({
  body: z.object({
    phoneNumber: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .max(15, "Phone number must not exceed 15 digits")
      .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),
    code: z
      .string()
      .min(4, "Verification code must be at least 4 digits")
      .max(6, "Verification code must not exceed 6 digits")
      .regex(/^\d{4,6}$/, "Verification code must contain only numbers"),
  }),
});

// Validation middleware factory
const createValidationMiddleware = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: "VALIDATION_ERROR",
        }));

        return res.status(400).json({
          success: false,
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          errors: validationErrors,
        });
      }

      next(error);
    }
  };
};

export const verificationValidation = {
  sendEmailVerification: (req: Request, res: Response, next: NextFunction) => {
    // No additional validation needed for sending email verification
    // User authentication is handled by authMiddleware
    next();
  },

  // Phone verification
  verifyPhone: createValidationMiddleware(verifyPhoneSchema),

  // Email verification
  verifyEmail: createValidationMiddleware(verifyEmailSchema),

  // Document verification
  uploadDocuments: createValidationMiddleware(uploadDocumentsSchema),

  resubmitDocuments: createValidationMiddleware(resubmitDocumentsSchema),

  // Get verification status - no validation needed
  getVerificationStatus: (req: Request, res: Response, next: NextFunction) => {
    // No additional validation needed for getting verification status
    // User authentication is handled by authMiddleware
    next();
  },
};
