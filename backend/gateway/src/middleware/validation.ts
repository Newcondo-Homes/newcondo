// backend/gateway/src/middleware/validation.ts
import { Request, Response, NextFunction } from "express";
import { z, ZodSchema, ZodError } from "zod";
import { logger } from "../utils/logger";

interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  headers?: ZodSchema;
}

interface ValidationError {
  field: string;
  message: string;
  code: string;
}

class RequestValidator {
  // Generic validation middleware
  validate(options: ValidationOptions) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const errors: ValidationError[] = [];

        // Validate request body
        if (options.body) {
          try {
            req.body = options.body.parse(req.body);
          } catch (error) {
            if (error instanceof ZodError) {
              errors.push(...this.formatZodErrors(error, "body"));
            }
          }
        }

        // Validate query parameters
        if (options.query) {
          try {
            req.query = options.query.parse(req.query);
          } catch (error) {
            if (error instanceof ZodError) {
              errors.push(...this.formatZodErrors(error, "query"));
            }
          }
        }

        // Validate route parameters
        if (options.params) {
          try {
            req.params = options.params.parse(req.params);
          } catch (error) {
            if (error instanceof ZodError) {
              errors.push(...this.formatZodErrors(error, "params"));
            }
          }
        }

        // Validate headers
        if (options.headers) {
          try {
            req.headers = options.headers.parse(req.headers);
          } catch (error) {
            if (error instanceof ZodError) {
              errors.push(...this.formatZodErrors(error, "headers"));
            }
          }
        }

        if (errors.length > 0) {
          logger.warn("Request validation failed", {
            path: req.path,
            method: req.method,
            errors,
            ip: req.ip,
          });

          return res.status(400).json({
            error: "Validation Error",
            message: "Request validation failed",
            details: errors,
          });
        }

        next();
      } catch (error) {
        logger.error("Validation middleware error:", error);
        res.status(500).json({
          error: "Internal Server Error",
          message: "Validation middleware error",
        });
      }
    };
  }

  private formatZodErrors(
    zodError: ZodError,
    source: string
  ): ValidationError[] {
    return zodError.errors.map((error) => ({
      field: `${source}.${error.path.join(".")}`,
      message: error.message,
      code: error.code,
    }));
  }

  // Common validation schemas
  commonSchemas = {
    // Pagination
    pagination: z.object({
      page: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 1)),
      limit: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 10)),
      sort: z.string().optional(),
      order: z.enum(["asc", "desc"]).optional(),
    }),

    // ID parameter
    idParam: z.object({
      id: z.string().uuid("Invalid ID format"),
    }),

    // Search query
    searchQuery: z.object({
      q: z.string().min(1, "Search query cannot be empty").optional(),
      category: z.string().optional(),
      location: z.string().optional(),
      minPrice: z
        .string()
        .optional()
        .transform((val) => (val ? parseFloat(val) : undefined)),
      maxPrice: z
        .string()
        .optional()
        .transform((val) => (val ? parseFloat(val) : undefined)),
    }),

    // Common headers
    authHeaders: z
      .object({
        authorization: z
          .string()
          .regex(/^Bearer .+/, "Invalid authorization header format"),
      })
      .partial(),

    // API key header
    apiKeyHeader: z.object({
      "x-api-key": z.string().min(1, "API key required"),
    }),

    // Request ID header
    requestIdHeader: z
      .object({
        "x-request-id": z.string().uuid().optional(),
      })
      .partial(),
  };

  // Service-specific validators
  authValidators = {
    login: this.validate({
      body: z
        .object({
          email: z.string().email("Invalid email format").optional(),
          phone: z
            .string()
            .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone format")
            .optional(),
          password: z.string().min(8, "Password must be at least 8 characters"),
        })
        .refine((data) => data.email || data.phone, {
          message: "Either email or phone is required",
        }),
    }),

    register: this.validate({
      body: z
        .object({
          email: z.string().email("Invalid email format").optional(),
          phone: z
            .string()
            .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone format")
            .optional(),
          password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
              "Password must contain uppercase, lowercase and number"
            ),
          firstName: z
            .string()
            .min(2, "First name must be at least 2 characters"),
          lastName: z
            .string()
            .min(2, "Last name must be at least 2 characters"),
          userType: z.enum(["TENANT", "LANDLORD", "AGENT"]),
          referralCode: z.string().optional(),
        })
        .refine((data) => data.email || data.phone, {
          message: "Either email or phone is required",
        }),
    }),

    verifyOtp: this.validate({
      body: z.object({
        identifier: z.string().min(1, "Identifier required"),
        otp: z.string().length(6, "OTP must be 6 digits"),
        type: z.enum([
          "EMAIL_VERIFICATION",
          "PHONE_VERIFICATION",
          "PASSWORD_RESET",
        ]),
      }),
    }),
  };

  propertyValidators = {
    create: this.validate({
      body: z.object({
        title: z.string().min(5, "Title must be at least 5 characters"),
        description: z
          .string()
          .min(20, "Description must be at least 20 characters"),
        propertyType: z.enum(["APARTMENT", "HOUSE", "CONDO", "STUDIO", "ROOM"]),
        listingType: z.enum(["RENT", "SALE"]),
        price: z.number().positive("Price must be positive"),
        currency: z.enum(["NGN", "USD", "GBP"]).default("NGN"),
        location: z.object({
          address: z.string().min(5, "Address required"),
          city: z.string().min(2, "City required"),
          state: z.string().min(2, "State required"),
          country: z.string().min(2, "Country required"),
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
        }),
        features: z.object({
          bedrooms: z.number().min(0),
          bathrooms: z.number().min(0),
          area: z.number().positive("Area must be positive"),
          furnished: z.boolean().default(false),
          parking: z.boolean().default(false),
          airConditioning: z.boolean().default(false),
          security: z.boolean().default(false),
        }),
        amenities: z.array(z.string()).default([]),
        utilities: z.array(z.string()).default([]),
        policies: z
          .object({
            petsAllowed: z.boolean().default(false),
            smokingAllowed: z.boolean().default(false),
            minimumStay: z.number().min(1).default(1),
            maximumStay: z.number().optional(),
          })
          .optional(),
      }),
    }),

    search: this.validate({
      query: this.commonSchemas.searchQuery.extend({
        propertyType: z
          .enum(["APARTMENT", "HOUSE", "CONDO", "STUDIO", "ROOM"])
          .optional(),
        listingType: z.enum(["RENT", "SALE"]).optional(),
        bedrooms: z
          .string()
          .optional()
          .transform((val) => (val ? parseInt(val) : undefined)),
        bathrooms: z
          .string()
          .optional()
          .transform((val) => (val ? parseInt(val) : undefined)),
        furnished: z
          .enum(["true", "false"])
          .optional()
          .transform((val) => val === "true"),
        radius: z
          .string()
          .optional()
          .transform((val) => (val ? parseFloat(val) : undefined)),
      }),
    }),
  };

  paymentValidators = {
    initiate: this.validate({
      body: z.object({
        amount: z.number().positive("Amount must be positive"),
        currency: z.enum(["NGN", "USD", "GBP"]).default("NGN"),
        paymentMethod: z.enum(["CARD", "BANK_TRANSFER", "WALLET"]),
        propertyId: z.string().uuid().optional(),
        description: z.string().min(5, "Description required"),
        metadata: z.record(z.any()).optional(),
      }),
    }),

    webhook: this.validate({
      headers: z.object({
        "x-flw-signature": z.string().min(1, "Webhook signature required"),
      }),
      body: z.object({
        event: z.string(),
        data: z.record(z.any()),
      }),
    }),
  };

  // File upload validation
  uploadValidator = this.validate({
    headers: z
      .object({
        "content-type": z
          .string()
          .regex(
            /^multipart\/form-data/,
            "Invalid content type for file upload"
          ),
      })
      .partial(),
  });

  // Generic ID parameter validator
  idValidator = this.validate({
    params: this.commonSchemas.idParam,
  });

  // Pagination validator
  paginationValidator = this.validate({
    query: this.commonSchemas.pagination,
  });
}

const validator = new RequestValidator();

export { validator, ValidationOptions, ValidationError };
