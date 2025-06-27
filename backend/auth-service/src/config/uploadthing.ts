// backend/auth-service/src/config/uploadthing.ts

import { createUploadthing, type FileRouter } from "uploadthing/server";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// Define the file router for UploadThing
export const ourFileRouter: FileRouter = {
  // Profile image uploader
  profileImageUploader: f({
    image: {
      maxFileSize: "1MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const userId = req.headers.get("x-user-id") as string;

      if (!userId) {
        throw new UploadThingError("Unauthorized");
      }

      // Return metadata to be stored with the file
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Profile image upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);

      // Return data to the client
      return {
        uploadedBy: metadata.userId,
        url: file.url,
      };
    }),

  // Property image uploader (for future use)
  propertyImageUploader: f({
    image: {
      maxFileSize: "2MB",
      maxFileCount: 10,
    },
  })
    .middleware(async ({ req }) => {
      const userId = req.headers.get("x-user-id") as string;
      const propertyId = req.headers.get("x-property-id") as string;

      if (!userId) {
        throw new UploadThingError("Unauthorized");
      }

      return { userId, propertyId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(
        "Property image upload complete for userId:",
        metadata.userId
      );
      console.log("Property ID:", metadata.propertyId);
      console.log("File URL:", file.url);

      return {
        uploadedBy: metadata.userId,
        propertyId: metadata.propertyId,
        url: file.url,
      };
    }),

  // Document uploader (for verification documents)
  documentUploader: f({
    pdf: {
      maxFileSize: "4MB",
      maxFileCount: 5,
    },
    image: {
      maxFileSize: "2MB",
      maxFileCount: 5,
    },
  })
    .middleware(async ({ req }) => {
      const userId = req.headers.get("x-user-id") as string;
      const documentType = req.headers.get("x-document-type") as string;

      if (!userId) {
        throw new UploadThingError("Unauthorized");
      }

      return { userId, documentType };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Document upload complete for userId:", metadata.userId);
      console.log("Document type:", metadata.documentType);
      console.log("File URL:", file.url);

      return {
        uploadedBy: metadata.userId,
        documentType: metadata.documentType,
        url: file.url,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
