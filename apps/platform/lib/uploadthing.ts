import { generateReactHelpers } from "@uploadthing/react";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@newcondo/auth/middleware";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Verification Documents Upload
  verificationDocuments: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
      acl: "private" // Keep verification documents private
    },
    pdf: {
      maxFileSize: "8MB",
      maxFileCount: 1,
      acl: "private"
    }
  })
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const session = await auth();

      if (!session?.user?.id) {
        throw new UploadThingError("Unauthorized - Please login to upload verification documents");
      }

      // Return user data to be available in onUploadComplete
      return {
        userId: session.user.id,
        userEmail: session.user.email
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Verification document uploaded by user:", metadata.userId);
      console.log("File URL:", file.url);
      console.log("File key:", file.key);
      console.log("File name:", file.name);
      console.log("File size:", file.size);

      // Save file info to your database here if needed
      // You can also send notifications, update user verification status, etc.

      return {
        uploadedBy: metadata.userId,
        fileUrl: file.url,
        fileKey: file.key,
        fileName: file.name,
        fileSize: file.size
      };
    }),

  // Selfie Upload (separate endpoint for selfies)
  selfieUpload: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
      acl: "private"
    }
  })
    .middleware(async ({ req }) => {
      const session = await auth();

      if (!session?.user?.id) {
        throw new UploadThingError("Unauthorized - Please login to upload selfie");
      }

      return {
        userId: session.user.id,
        userEmail: session.user.email
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Selfie uploaded by user:", metadata.userId);
      console.log("File URL:", file.url);

      return {
        uploadedBy: metadata.userId,
        fileUrl: file.url,
        fileKey: file.key,
        fileName: file.name,
        fileSize: file.size
      };
    }),

  // Property Documents Upload (for future use)
  propertyDocuments: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 5,
      acl: "private"
    },
    pdf: {
      maxFileSize: "16MB",
      maxFileCount: 3,
      acl: "private"
    }
  })
    .middleware(async ({ req }) => {
      const session = await auth();

      if (!session?.user?.id) {
        throw new UploadThingError("Unauthorized");
      }

      return {
        userId: session.user.id,
        userEmail: session.user.email
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Property document uploaded by user:", metadata.userId);
      console.log("File URL:", file.url);

      return {
        uploadedBy: metadata.userId,
        fileUrl: file.url,
        fileKey: file.key,
        fileName: file.name,
        fileSize: file.size
      };
    }),

  // Property Images Upload
  propertyImages: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 10,
      acl: "public-read" // Property images can be public
    }
  })
    .middleware(async ({ req }) => {
      const session = await auth();

      if (!session?.user?.id) {
        throw new UploadThingError("Unauthorized");
      }

      return {
        userId: session.user.id,
        userEmail: session.user.email
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Property image uploaded by user:", metadata.userId);
      console.log("File URL:", file.url);

      return {
        uploadedBy: metadata.userId,
        fileUrl: file.url,
        fileKey: file.key,
        fileName: file.name,
        fileSize: file.size
      };
    }),


  // dispute Evidence:
  disputeEvidence: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 5,
      acl: "private"
    },
    pdf: {
      maxFileSize: "8MB",
      maxFileCount: 3,
      acl: "private"
    }
  })
    .middleware(async ({ req }) => {
      const session = await auth();

      if (!session?.user?.id) {
        throw new UploadThingError("Unauthorized");
      }

      return {
        userId: session.user.id,
        userEmail: session.user.email
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Dispute evidence uploaded by user:", metadata.userId);
      return {
        uploadedBy: metadata.userId,
        fileUrl: file.url,
        fileKey: file.key,
        fileName: file.name,
        fileSize: file.size
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

// Generate React helpers for your FileRouter
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();