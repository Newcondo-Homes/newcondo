import {
  prisma,
  DocumentType,
  DocumentStatus,
  DocumentSide,
  VerificationStatus,
} from "@newcondo/db";
import { OTPType } from "@newcondo/db";
import { otpService } from "./otpService";
import { sendVerificationEmail } from "../../../shared/src/utils/email";
// import { notificationService } from '../../../shared/src/utils/notifications';
// import { AuthError } from '../types/auth';

interface UploadDocumentData {
  documentType: DocumentType;
  documentSide?: DocumentSide;
  documentNumber?: string;
  fileName?: string;
  fileUrl?: string;
  fileSizeBytes?: number;
  mimeType?: string;
}

interface VerificationStatusResponse {
  userId: string;
  verificationStatus: VerificationStatus;
  verificationRejectionReason?: string;
  verifiedAt?: Date;
  documents: {
    documentType: DocumentType;
    status: DocumentStatus;
    isRequired: boolean;
    verificationNotes?: string;
  }[];
  completionPercentage: number;
  nextRequiredDocuments: DocumentType[];
}

class VerificationService {
  // Required documents for verification
  private readonly REQUIRED_DOCUMENTS: DocumentType[] = [
    "NIN", // Nigerian National ID
    "SELFIE", // Selfie for identity verification
  ];

  // Optional documents that can strengthen verification
  private readonly OPTIONAL_DOCUMENTS: DocumentType[] = [
    "BVN",
    "PASSPORT",
    "VOTERS_CARD",
    "DRIVERS_LICENSE",
  ];

  async uploadDocument(userId: string, data: UploadDocumentData) {
    try {
      // Check if document already exists
      const existingDocument = await prisma.document.findFirst({
        where: {
          userId,
          documentType: data.documentType,
          documentSide: data.documentSide || "SINGLE",
        },
      });

      if (existingDocument) {
        // Update existing document
        const updatedDocument = await prisma.document.update({
          where: { id: existingDocument.id },
          data: {
            documentNumber: data.documentNumber,
            fileName: data.fileName,
            fileUrl: data.fileUrl,
            fileSizeBytes: data.fileSizeBytes,
            mimeType: data.mimeType,
            status: "PENDING",
            verificationNotes: null,
            updatedAt: new Date(),
          },
        });

        // Notify admins about resubmission
        // await this.notifyAdminsOfNewVerification(userId, data.documentType, true);

        return updatedDocument;
      }

      // Create new document
      const document = await prisma.document.create({
        data: {
          userId,
          documentType: data.documentType,
          documentSide: data.documentSide || "SINGLE",
          documentNumber: data.documentNumber,
          fileName: data.fileName,
          fileUrl: data.fileUrl,
          fileSizeBytes: data.fileSizeBytes,
          mimeType: data.mimeType,
          status: "PENDING",
          isRequired: this.REQUIRED_DOCUMENTS.includes(data.documentType),
        },
      });

      // Check if user has completed all required documents
      await this.updateUserVerificationStatus(userId);

      // Notify admins about new verification
      // await this.notifyAdminsOfNewVerification(userId, data.documentType, false);

      return document;
    } catch (error) {
      console.error("Upload document error:", error);
      throw new Error("Failed to upload document");
    }
  }

  async getUserDocuments(userId: string) {
    try {
      const documents = await prisma.document.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          documentType: true,
          documentSide: true,
          documentNumber: true,
          fileName: true,
          fileUrl: true,
          status: true,
          verificationNotes: true,
          isRequired: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return documents;
    } catch (error) {
      console.error("Get user documents error:", error);
      throw new Error("Failed to retrieve user documents");
    }
  }

  async deleteDocument(userId: string, documentId: string) {
    try {
      const document = await prisma.document.findFirst({
        where: { id: documentId, userId },
      });

      if (!document) {
        throw new Error("Document not found");
      }

      await prisma.document.delete({
        where: { id: documentId },
      });

      // Update user verification status
      await this.updateUserVerificationStatus(userId);
    } catch (error) {
      console.error("Delete document error:", error);
      throw new Error("Failed to delete document");
    }
  }

  async resubmitDocument(
    userId: string,
    documentId: string,
    data: UploadDocumentData
  ) {
    try {
      const document = await prisma.document.findFirst({
        where: { id: documentId, userId },
      });

      if (!document) {
        throw new Error("Document not found");
      }

      if (document.status !== "REJECTED") {
        throw new Error("Only rejected documents can be resubmitted");
      }

      const updatedDocument = await prisma.document.update({
        where: { id: documentId },
        data: {
          documentNumber: data.documentNumber,
          fileName: data.fileName,
          fileUrl: data.fileUrl,
          fileSizeBytes: data.fileSizeBytes,
          mimeType: data.mimeType,
          status: "PENDING",
          verificationNotes: null,
          updatedAt: new Date(),
        },
      });

      // Notify admins about resubmission
      await this.notifyAdminsOfNewVerification(userId, data.documentType, true);

      return updatedDocument;
    } catch (error) {
      console.error("Resubmit document error:", error);
      throw new Error("Failed to resubmit document");
    }
  }

  // Admin methods
  async getPendingVerifications(page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const [verifications, totalCount] = await Promise.all([
        prisma.user.findMany({
          where: {
            OR: [
              { verificationStatus: "PENDING" },
              {
                documents: {
                  some: { status: "PENDING" },
                },
              },
            ],
          },
          select: {
            id: true,
            name: true,
            email: true,
            verificationStatus: true,
            createdAt: true,
            documents: {
              where: { status: "PENDING" },
              select: {
                id: true,
                documentType: true,
                documentSide: true,
                fileName: true,
                fileUrl: true,
                createdAt: true,
                isRequired: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({
          where: {
            OR: [
              { verificationStatus: "PENDING" },
              {
                documents: {
                  some: { status: "PENDING" },
                },
              },
            ],
          },
        }),
      ]);

      return {
        verifications,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      };
    } catch (error) {
      console.error("Get pending verifications error:", error);
      throw new Error("Failed to retrieve pending verifications");
    }
  }

  async updateVerificationStatus(
    documentId: string,
    status: DocumentStatus,
    adminId: string,
    verificationNotes?: string
  ) {
    try {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: { user: true },
      });

      if (!document) {
        throw new Error("Document not found");
      }

      // Update document status
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status,
          verificationNotes,
          updatedAt: new Date(),
        },
      });

      // Update user verification status
      await this.updateUserVerificationStatus(document.userId);

      // Log admin action
      await prisma.adminAction.create({
        data: {
          adminId,
          action: status === "APPROVED" ? "USER_VERIFIED" : "USER_REJECTED",
          targetType: "Document",
          targetId: documentId,
          description: `Updated ${document.documentType} verification status to ${status}`,
          metadata: {
            documentType: document.documentType,
            verificationNotes,
          },
        },
      });

      // Notify user about status change
      await this.notifyUserOfStatusChange(
        document.userId,
        document.documentType,
        status,
        verificationNotes
      );

      return { success: true };
    } catch (error) {
      console.error("Update verification status error:", error);
      throw new Error("Failed to update verification status");
    }
  }

  async getUserVerificationDetails(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          verificationStatus: true,
          verificationRejectionReason: true,
          verifiedAt: true,
          verifiedBy: true,
          createdAt: true,
          documents: {
            select: {
              id: true,
              documentType: true,
              documentSide: true,
              documentNumber: true,
              fileName: true,
              fileUrl: true,
              status: true,
              verificationNotes: true,
              isRequired: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      return user;
    } catch (error) {
      console.error("Get user verification details error:", error);
      throw new Error("Failed to retrieve user verification details");
    }
  }

  // Private helper methods
  private async updateUserVerificationStatus(userId: string) {
    try {
      const documents = await prisma.document.findMany({
        where: { userId },
        select: {
          documentType: true,
          status: true,
          isRequired: true,
        },
      });

      const requiredDocuments = documents.filter((doc) => doc.isRequired);
      const approvedRequiredDocs = requiredDocuments.filter(
        (doc) => doc.status === "APPROVED"
      );
      const rejectedDocs = documents.filter((doc) => doc.status === "REJECTED");

      let newStatus: VerificationStatus;
      let rejectionReason: string | null = null;
      let verifiedAt: Date | null = null;

      if (rejectedDocs.length > 0) {
        newStatus = "REJECTED";
        rejectionReason = `Documents rejected: ${rejectedDocs.map((d) => d.documentType).join(", ")}`;
      } else if (
        approvedRequiredDocs.length === this.REQUIRED_DOCUMENTS.length
      ) {
        newStatus = "VERIFIED";
        verifiedAt = new Date();
      } else {
        newStatus = "PENDING";
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          verificationStatus: newStatus,
          verificationRejectionReason: rejectionReason,
          verifiedAt,
        },
      });
    } catch (error) {
      console.error("Update user verification status error:", error);
      throw new Error("Failed to update user verification status");
    }
  }

  private async notifyAdminsOfNewVerification(
    userId: string,
    documentType: DocumentType,
    isResubmission: boolean
  ) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });

      if (!user) return;

      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { email: true },
      });

      const emailData = {
        userEmail: user.email,
        userName: user.name || "Unknown",
        documentType,
        isResubmission,
        verificationUrl: `${process.env.ADMIN_BASE_URL}/verifications/${userId}`,
      };

      // Send notifications to all admins
      // await Promise.all(
      //   admins.map((admin) =>
      //     notificationService.sendEmail(
      //       admin.email,
      //       isResubmission
      //         ? "Document Resubmitted for Verification"
      //         : "New Document Verification Request",
      //       "admin-verification-request",
      //       emailData
      //     )
      //   )
      // );
    } catch (error) {
      console.error("Notify admins error:", error);
      // Don't throw error, just log it
    }
  }

  private async notifyUserOfStatusChange(
    userId: string,
    documentType: DocumentType,
    status: DocumentStatus,
    verificationNotes?: string
  ) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });

      if (!user) return;

      const emailData = {
        userName: user.name || "User",
        documentType,
        status,
        verificationNotes,
        dashboardUrl: `${process.env.PLATFORM_BASE_URL}/dashboard/profile/verification`,
      };

      const subject =
        status === "APPROVED"
          ? "Document Verified Successfully"
          : "Document Verification Update";
      const template =
        status === "APPROVED" ? "document-approved" : "document-rejected";

      // await notificationService.sendEmail(
      //   user.email,
      //   subject,
      //   template,
      //   emailData
      // );
    } catch (error) {
      console.error("Notify user error:", error);
      // Don't throw error, just log it
    }
  }

  async sendEmailVerification(userId: string, email: string) {
    try {
      // Check if user exists and email is not already verified
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AuthError("User not found", "USER_NOT_FOUND", 404);
      }

      if (user.emailVerified) {
        throw new AuthError(
          "Email is already verified",
          "EMAIL_ALREADY_VERIFIED",
          400
        );
      }

      // Generate and send OTP
      const otp = await otpService.generate_OTP(
        email,
        OTPType.EMAIL_VERIFICATION
      );

      if (!otp.success) {
        throw new Error(
          otp.message || "OTP verification failed. Please check your code."
        );
      }
      // Send email with OTP
      const emailSent = await sendVerificationEmail(
        email,
        otp.otpCode!,
        user.name || "User"
      );

      if (!emailSent) {
        throw new AuthError(
          "Failed to send verification email",
          "EMAIL_SEND_FAILED",
          500
        );
      }

      return {
        sentTo: email,
        expiresIn: Math.floor((otp.expiresAt!.getTime() - Date.now()) / 1000),
      };
    } catch (error: any) {
      console.error("Send email verification error:", error);
      throw error instanceof AuthError
        ? error
        : new AuthError(
            "Failed to send email verification",
            "VERIFICATION_SEND_FAILED",
            500
          );
    }
  }

  async verifyEmail(userId: string, email: string, code: string) {
    try {
      // Verify OTP
      const isValidOTP = await otpService.verifyOTP(
        email,
        code,
        OTPType.EMAIL_VERIFICATION
      );

      if (!isValidOTP) {
        throw new AuthError(
          "Invalid or expired verification code",
          "INVALID_OTP",
          400
        );
      }

      // Update user's email verification status
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          emailVerified: new Date(),
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          verificationStatus: true,
          emailVerified: true,
          phoneVerified: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Log verification event
      await prisma.eventLog.create({
        data: {
          userId,
          type: "EMAIL_VERIFIED",
          metadata: {
            email,
            verifiedAt: new Date(),
          },
        },
      });

      return {
        verifiedAt: updatedUser.emailVerified,
        user: {
          ...updatedUser,
          isEmailVerified: !!updatedUser.emailVerified,
          isPhoneVerified: !!updatedUser.phoneVerified,
        },
      };
    } catch (error: any) {
      console.error("Email verification error:", error);
      throw error instanceof AuthError
        ? error
        : new AuthError(
            "Email verification failed",
            "EMAIL_VERIFICATION_FAILED",
            500
          );
    }
  }

  async resendEmailVerification(userId: string, email: string) {
    try {
      // Check for recent verification attempts
      const recentOTP = await prisma.oTPCode.findFirst({
        where: {
          identifier: email,
          type: OTPType.EMAIL_VERIFICATION,
          createdAt: {
            gte: new Date(Date.now() - 2 * 60 * 1000), // Within last 2 minutes
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (recentOTP) {
        const nextResendTime = new Date(
          recentOTP.createdAt.getTime() + 2 * 60 * 1000
        );
        throw new AuthError(
          "Please wait before requesting another verification code",
          "RESEND_TOO_SOON",
          429
        );
      }

      // Send new verification
      const result = await this.sendEmailVerification(userId, email);

      return {
        ...result,
        canResendAt: new Date(Date.now() + 2 * 60 * 1000),
      };
    } catch (error: any) {
      console.error("Resend email verification error:", error);
      throw error instanceof AuthError
        ? error
        : new AuthError(
            "Failed to resend verification email",
            "VERIFICATION_RESEND_FAILED",
            500
          );
    }
  }

  async getVerificationStatus(
    userId: string
  ): Promise<VerificationStatusResponse> {
    try {
      const [user, documents] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            verificationStatus: true,
            verificationRejectionReason: true,
            verifiedAt: true,
          },
        }),
        prisma.document.findMany({
          where: { userId },
          select: {
            documentType: true,
            status: true,
            isRequired: true,
            verificationNotes: true,
          },
        }),
      ]);

      if (!user) {
        throw new AuthError("User not found", "USER_NOT_FOUND", 404);
      }

      // Calculate completion percentage
      const requiredDocuments = this.REQUIRED_DOCUMENTS;
      const uploadedRequiredDocs = documents.filter((doc) =>
        requiredDocuments.includes(doc.documentType)
      );
      const completionPercentage =
        (uploadedRequiredDocs.length / requiredDocuments.length) * 100;

      // Get next required documents
      const uploadedTypes = documents.map((doc) => doc.documentType);
      const nextRequiredDocuments = requiredDocuments.filter(
        (type) => !uploadedTypes.includes(type)
      );

      return {
        userId: user.id,
        verificationStatus: user.verificationStatus,
        verificationRejectionReason:
          user.verificationRejectionReason || undefined,
        verifiedAt: user.verifiedAt || undefined,
        documents: documents.map((doc) => ({
          documentType: doc.documentType,
          status: doc.status,
          isRequired: doc.isRequired,
          verificationNotes: doc.verificationNotes || undefined,
        })),
        completionPercentage,
        nextRequiredDocuments,
      };
    } catch (error: any) {
      console.error("Get verification status error:", error);
      throw error instanceof AuthError
        ? error
        : new AuthError(
            "Failed to get verification status",
            "VERIFICATION_STATUS_FAILED",
            500
          );
    }
  }
}

// Custom error class
class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export const verificationService = new VerificationService();
