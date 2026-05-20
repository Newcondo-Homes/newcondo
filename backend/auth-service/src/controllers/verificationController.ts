import { Request, Response } from "express";
import { verificationService } from "../services/verificationService";
import { AuthenticatedRequest } from "../types/auth";
import { standardResponse } from "@newcondo/backend-shared";
import { z } from "zod";

// Validation schemas
const uploadDocumentSchema = z.object({
  documentType: z.enum([
    "NIN",
    "BVN",
    "PASSPORT",
    "VOTERS_CARD",
    "DRIVERS_LICENSE",
    "SELFIE",
  ]),
  documentSide: z.enum(["FRONT", "BACK", "SINGLE"]).optional(),
  documentNumber: z.string().optional(),
  fileName: z.string().optional(),
  fileUrl: z.string().optional(),
  fileSizeBytes: z.number().optional(),
  mimeType: z.string().optional(),
});

const updateVerificationStatusSchema = z.object({
  documentId: z.string(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  verificationNotes: z.string().optional(),
});

class VerificationController {
  async sendEmailVerification(
    req: AuthenticatedRequest | Request,
    res: Response
  ) {
    try {
      const { user } = req;

      if (!user) return;

      if (user?.emailVerified) {
        return res.status(400).json({
          success: false,
          message: "Email is already verified",
          code: "EMAIL_ALREADY_VERIFIED",
        });
      }

      const result = await verificationService.sendEmailVerification(
        user.id,
        user.email
      );

      res.status(200).json({
        success: true,
        message: "Verification code sent to your email",
        data: {
          sentTo: user.email,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error: any) {
      console.error("Send email verification error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to send verification email",
        code: error.code || "VERIFICATION_SEND_FAILED",
      });
    }
  }

  async verifyEmail(req: AuthenticatedRequest | Request, res: Response) {
    try {
      const { code } = req.body;
      const { user } = req;

      if (!user) return;

      if (user?.emailVerified) {
        return res.status(400).json({
          success: false,
          message: "Email is already verified",
          code: "EMAIL_ALREADY_VERIFIED",
        });
      }

      const result = await verificationService.verifyEmail(
        user.id,
        user.email,
        code
      );

      res.status(200).json({
        success: true,
        message: "Email verified successfully",
        data: {
          verifiedAt: result.verifiedAt,
          user: result.user,
        },
      });
    } catch (error: any) {
      console.error("Email verification error:", error);
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || "Email verification failed",
        code: error.code || "EMAIL_VERIFICATION_FAILED",
      });
    }
  }

  async resendEmailVerification(
    req: AuthenticatedRequest | Request,
    res: Response
  ) {
    try {
      const { user } = req;

      if (!user) return;

      if (user.emailVerified) {
        return res.status(400).json({
          success: false,
          message: "Email is already verified",
          code: "EMAIL_ALREADY_VERIFIED",
        });
      }

      const result = await verificationService.resendEmailVerification(
        user.id,
        user.email
      );

      res.status(200).json({
        success: true,
        message: "Verification code resent to your email",
        data: {
          sentTo: user.email,
          expiresIn: result.expiresIn,
          canResendAt: result.canResendAt,
        },
      });
    } catch (error: any) {
      console.error("Resend email verification error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to resend verification email",
        code: error.code || "VERIFICATION_RESEND_FAILED",
      });
    }
  }

  async uploadDocuments(req: AuthenticatedRequest | Request, res: Response) {
    try {
      const { user } = req;
      // const { documents } = req.body;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
          code: "NOT_AUTHENTICATED",
        });
      }

      const validatedData = uploadDocumentSchema.parse(req.body);

      const result = await verificationService.uploadDocument(
        user.id,
        validatedData
      );

      // remove the "let result = null" below as its just a placeholder
      // let result = null;

      res.status(200).json({
        success: true,
        message: "Documents uploaded successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Upload documents error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to upload documents",
        code: error.code || "DOCUMENT_UPLOAD_FAILED",
      });
    }
  }

  async getVerificationStatus(
    req: AuthenticatedRequest | Request,
    res: Response
  ) {
    try {
      const { user } = req;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
          code: "NOT_AUTHENTICATED",
        });
      }

      const status = await verificationService.getVerificationStatus(user.id);

      res.status(200).json({
        success: true,
        message: "Verification status retrieved successfully",
        data: status,
      });
    } catch (error: any) {
      console.error("Get verification status error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to retrieve verification status",
        code: error.code || "VERIFICATION_STATUS_FAILED",
      });
    }
  }

  async resubmitDocument(req: AuthenticatedRequest | Request, res: Response) {
    try {
      const { user } = req;
      const { documents } = req.body;
      const { documentId } = req.params;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
          code: "NOT_AUTHENTICATED",
        });
      }

      const validatedData = uploadDocumentSchema.parse(req.body);

      const result = await verificationService.resubmitDocument(
        user.id,
        documentId,
        validatedData
      );

      // remove the "let result = null" below as its just a placeholder
      // let result = null;

      res.status(200).json({
        success: true,
        message: "Documents resubmitted successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Resubmit documents error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to resubmit documents",
        code: error.code || "DOCUMENT_RESUBMIT_FAILED",
      });
    }
  }

  async verifyDocuments(req: AuthenticatedRequest | Request, res: Response) {
    try {
      const { userId, documentId, status, notes } = req.body;

      // const result = await verificationService.verifyDocuments(
      //   userId,
      //   documentId,
      //   status,
      //   notes
      // );

      // remove the "let result = null" below as its just a placeholder
      let result = null;

      res.status(200).json({
        success: true,
        message: "Document verification completed",
        data: result,
      });
    } catch (error: any) {
      console.error("Verify documents error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to verify documents",
        code: error.code || "DOCUMENT_VERIFICATION_FAILED",
      });
    }
  }

  async getUserDocuments(req: AuthenticatedRequest | Request, res: Response) {
    try {
      const { user } = req;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
          code: "NOT_AUTHENTICATED",
        });
      }

      const documents = await verificationService.getUserDocuments(user.id);

      // remove the "let documents = null" below as its just a placeholder
      // let documents = null;

      res.status(200).json({
        success: true,
        message: "Documents retrieved successfully",
        data: documents,
      });
    } catch (error: any) {
      console.error("Get documents error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to retrieve documents",
        code: error.code || "GET_DOCUMENTS_FAILED",
      });
    }
  }

  async deleteDocument(req: AuthenticatedRequest | Request, res: Response) {
    try {
      const { user } = req;
      const { documentId } = req.params;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
          code: "NOT_AUTHENTICATED",
        });
      }

      // await verificationService.deleteDocument(user.id, documentId);

      res.status(200).json({
        success: true,
        message: "Document deleted successfully",
      });
    } catch (error: any) {
      console.error("Delete document error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to delete document",
        code: error.code || "DELETE_DOCUMENT_FAILED",
      });
    }
  }

  async updateVerificationStatus(
    req: AuthenticatedRequest | Request,
    res: Response
  ) {
    try {
      const { userId, status, rejectionReason } = req.body;

      // const result = await verificationService.updateVerificationStatus(
      //   userId,
      //   status,
      //   rejectionReason
      // );

      // remove the "let result = null" below as its just a placeholder
      let result = null;

      res.status(200).json({
        success: true,
        message: "Verification status updated successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Update verification status error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to update verification status",
        code: error.code || "UPDATE_VERIFICATION_STATUS_FAILED",
      });
    }
  }

  // Admin: Get pending verifications
  async getPendingVerifications(
    req: AuthenticatedRequest | Request,
    res: Response
  ) {
    try {
      const adminId = req.user?.id;
      if (!adminId || req.user?.role !== "ADMIN") {
        return res
          .status(403)
          .json(standardResponse(false, "Access denied", null));
      }

      const { page = 1, limit = 20 } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const verifications = await verificationService.getPendingVerifications(
        pageNum,
        limitNum
      );

      return res
        .status(200)
        .json(
          standardResponse(
            true,
            "Pending verifications retrieved successfully",
            verifications
          )
        );
    } catch (error) {
      console.error("Get pending verifications error:", error);
      return res
        .status(500)
        .json(
          standardResponse(
            false,
            "Failed to retrieve pending verifications",
            null
          )
        );
    }
  }

  // Admin: Get user verification details
  async getUserVerificationDetails(
    req: AuthenticatedRequest | Request,
    res: Response
  ) {
    try {
      const adminId = req.user?.id;
      if (!adminId || req.user?.role !== "ADMIN") {
        return res
          .status(403)
          .json(standardResponse(false, "Access denied", null));
      }

      const { userId } = req.params;

      const details =
        await verificationService.getUserVerificationDetails(userId);

      return res
        .status(200)
        .json(
          standardResponse(
            true,
            "User verification details retrieved successfully",
            details
          )
        );
    } catch (error) {
      console.error("Get user verification details error:", error);
      return res
        .status(500)
        .json(
          standardResponse(
            false,
            "Failed to retrieve user verification details",
            null
          )
        );
    }
  }
}

export const verificationController = new VerificationController();
