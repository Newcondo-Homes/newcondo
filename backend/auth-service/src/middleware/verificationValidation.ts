import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { DocumentType, DocumentSide } from "@newcondo/db";

// Validation schemas
const documentUploadSchema = z.object({
  body: z.object({
    documentType: z.nativeEnum(DocumentType),
    documentSide: z.nativeEnum(DocumentSide).optional(),
    pageNumber: z.number().int().positive().optional(),
    documentNumber: z.string().optional(),
    propertyId: z.string().optional(),
    fileName: z.string().optional(),
    fileUrl: z.string().url().optional(),
    fileSizeBytes: z.number().int().positive().optional(),
    mimeType: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
  }),
});

const documentNumberSchema = z.object({
  body: z.object({
    documentType: z.nativeEnum(DocumentType),
    documentNumber: z.string().min(1, "Document number is required"),
    propertyId: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
  }),
});

const updateDocumentStatusSchema = z.object({
  body: z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "EXPIRED"]),
    verificationNotes: z.string().optional(),
  }),
  params: z.object({
    documentId: z.string().cuid(),
  }),
});

const bulkUpdateDocumentsSchema = z.object({
  body: z.object({
    documentIds: z.array(z.string().cuid()),
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "EXPIRED"]),
    verificationNotes: z.string().optional(),
  }),
});

const getUserDocumentsSchema = z.object({
  params: z.object({
    userId: z.string().cuid().optional(),
  }),
  query: z.object({
    documentType: z.nativeEnum(DocumentType).optional(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "EXPIRED"]).optional(),
    propertyId: z.string().cuid().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});

const deleteDocumentSchema = z.object({
  params: z.object({
    documentId: z.string().cuid(),
  }),
});

// Validation middleware functions
export const validateDocumentUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = documentUploadSchema.parse(req);

    // Additional validation for file upload vs document number
    const { documentType, documentNumber, fileUrl, fileName } = result.body;

    // Document types that typically require file upload
    const fileUploadTypes = [
      DocumentType.SELFIE,
      DocumentType.VOTERS_CARD,
      DocumentType.DRIVERS_LICENSE,
      DocumentType.OWNERSHIP_DOCUMENT,
      DocumentType.CONSENT_DOCUMENT,
      DocumentType.UNDERTAKING_DOCUMENT,
      DocumentType.BUSINESS_REGISTRATION,
      DocumentType.TAX_CERTIFICATE,
      DocumentType.UTILITY_BILL,
      DocumentType.BANK_STATEMENT,
      DocumentType.OTHER,
    ];

    // Document types that can be ID-only
    const idOnlyTypes = [
      DocumentType.NIN,
      DocumentType.BVN,
      DocumentType.PASSPORT,
    ];

    // Validate based on document type
    if ((fileUploadTypes as readonly string[]).includes(documentType)) {
      if (!fileUrl || !fileName) {
        return res.status(400).json({
          success: false,
          message: `Document type ${documentType} requires file upload with fileUrl and fileName`,
        });
      }
    } else if ((idOnlyTypes as readonly string[]).includes(documentType)) {
      // For ID-only types, either documentNumber or file upload is required
      if (!documentNumber && !fileUrl) {
        return res.status(400).json({
          success: false,
          message: `Document type ${documentType} requires either documentNumber or file upload`,
        });
      }
    }

    // Validate document side for documents that have sides
    const documentsWithSides = [
      DocumentType.VOTERS_CARD,
      DocumentType.DRIVERS_LICENSE,
    ];

    if (
      (documentsWithSides as readonly string[]).includes(documentType) &&
      fileUrl
    ) {
      const { documentSide } = result.body;
      if (!documentSide || documentSide === "SINGLE") {
        return res.status(400).json({
          success: false,
          message: `Document type ${documentType} requires documentSide to be FRONT or BACK`,
        });
      }
    }

    req.validatedData = result;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
    next(error);
  }
};

export const validateDocumentNumber = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = documentNumberSchema.parse(req);

    // Additional validation for document number format
    const { documentType, documentNumber } = result.body;

    // Validate document number format based on type
    switch (documentType) {
      case DocumentType.NIN:
        if (!/^\d{11}$/.test(documentNumber)) {
          return res.status(400).json({
            success: false,
            message: "NIN must be 11 digits",
          });
        }
        break;
      case DocumentType.BVN:
        if (!/^\d{11}$/.test(documentNumber)) {
          return res.status(400).json({
            success: false,
            message: "BVN must be 11 digits",
          });
        }
        break;
      case DocumentType.PASSPORT:
        if (!/^[A-Z]\d{8}$/.test(documentNumber)) {
          return res.status(400).json({
            success: false,
            message: "Passport number must be in format A12345678",
          });
        }
        break;
      default:
        // For other document types, allow any non-empty string
        if (!documentNumber || documentNumber.trim().length === 0) {
          return res.status(400).json({
            success: false,
            message: "Document number cannot be empty",
          });
        }
    }

    req.validatedData = result;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
    next(error);
  }
};

export const validateUpdateDocumentStatus = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = updateDocumentStatusSchema.parse(req);

    // Additional validation for status transitions
    const { status, verificationNotes } = result.body;

    // Require verification notes for rejection
    if (
      status === "REJECTED" &&
      (!verificationNotes || verificationNotes.trim().length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Verification notes are required when rejecting a document",
      });
    }

    req.validatedData = result;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
    next(error);
  }
};

export const validateBulkUpdateDocuments = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = bulkUpdateDocumentsSchema.parse(req);

    // Additional validation for bulk operations
    const { documentIds, status, verificationNotes } = result.body;

    if (documentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one document ID is required",
      });
    }

    if (documentIds.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Cannot update more than 50 documents at once",
      });
    }

    // Require verification notes for rejection
    if (
      status === "REJECTED" &&
      (!verificationNotes || verificationNotes.trim().length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Verification notes are required when rejecting documents",
      });
    }

    req.validatedData = result;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
    next(error);
  }
};

export const validateGetUserDocuments = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = getUserDocumentsSchema.parse(req);

    // Set default pagination values
    const query = result.query;
    if (!query.page) query.page = 1;
    if (!query.limit) query.limit = 20;

    // Validate pagination limits
    if (query.page < 1) {
      return res.status(400).json({
        success: false,
        message: "Page must be greater than 0",
      });
    }

    if (query.limit < 1 || query.limit > 100) {
      return res.status(400).json({
        success: false,
        message: "Limit must be between 1 and 100",
      });
    }

    req.validatedData = result;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
    next(error);
  }
};

export const validateDeleteDocument = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = deleteDocumentSchema.parse(req);
    req.validatedData = result;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
    next(error);
  }
};

// File upload validation middleware
export const validateFileUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { mimetype, size } = req.file || {};

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Validate file type
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (!allowedMimeTypes.includes(mimetype!)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid file type. Only JPEG, PNG, WebP, and PDF files are allowed",
      });
    }

    // Validate file size (10MB limit)
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (size! > maxSizeBytes) {
      return res.status(400).json({
        success: false,
        message: "File size cannot exceed 10MB",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Document access validation middleware
export const validateDocumentAccess = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const { userId } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Users can only access their own documents unless they're admin
    if (userId && userId !== user.id && user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only access your own documents",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Admin access validation middleware
export const validateAdminAccess = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Custom validation for document uniqueness
export const validateDocumentUniqueness = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { documentType, documentSide, pageNumber } = req.body;
    const { user } = req;

    if (!user) return;
    // Store validation data for service layer to use
    req.documentValidation = {
      userId: user.id,
      documentType,
      documentSide: documentSide || "SINGLE",
      pageNumber: pageNumber || 1,
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Type extensions for Request object
declare global {
  namespace Express {
    interface Request {
      validatedData?: any;
      documentValidation?: {
        userId: string;
        documentType: string;
        documentSide: string;
        pageNumber: number;
      };
    }
  }
}
