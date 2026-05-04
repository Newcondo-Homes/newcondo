"use client";

import { useState } from "react";
import {
  Upload,
  X,
  Image as ImageIcon,
  FileText,
  Camera,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@newcondo/ui/";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@newcondo/ui/";
import { Badge } from "@newcondo/ui/";
import { Alert, AlertDescription } from "@newcondo/ui/";
import { Progress } from "@newcondo/ui/";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@newcondo/ui/";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@newcondo/ui/";
import { Input } from "@newcondo/ui/";
import { Label } from "@newcondo/ui/";
import { Textarea } from "@newcondo/ui/";
import { useVerification } from "@/hooks/useVerification";
import { DocumentType, DocumentSide, DocumentStatus } from "@/types/enums";
import {
 verificationSubmissionSchema,
 documentUploadSchema,
 type DocumentUpload,
  type  VerificationSubmission,
} from "@/lib/validations/verification";
import { cn } from "@/lib/utils";
import { Separator } from "@newcondo/ui/";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from 'zod';

import { useUploadThing } from "@/lib/uploadthing";
// import { verificationSchema, type VerificationFormData } from "@/lib/validations/verification";

const currentDocumentFormSchema = documentUploadSchema.partial().and(
  z.object({
    documentType: z.nativeEnum(DocumentType, {
      required_error: "Please select a document type.",
    }),
  })
);

type CurrentDocumentFormData = z.infer<typeof currentDocumentFormSchema>;

interface VerificationUploaderProps {
  className?: string;
  onUploadComplete?: () => void;
}

// interface VerificationUploaderProps {
//   userId: string;
//   existingDocuments?: Array<{
//     id: string;
//     documentType: DocumentType;
//     documentSide?: DocumentSide;
//     documentNumber?: string;
//     fileUrl?: string;
//     fileName?: string;
//     status: DocumentStatus;
//     verificationNotes?: string;
//   }>;
// }

interface UploadFile {
  file: File;
  preview: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

const DOCUMENT_TYPES = [
  {
    value: DocumentType.NIN,
    label: "National Identification Number (NIN)",
    needsFile: false,
  },
  {
    value: DocumentType.BVN,
    label: "Bank Verification Number (BVN)",
    needsFile: false,
  },
  {
    value: DocumentType.PASSPORT,
    label: "International Passport",
    needsFile: true,
  },
  { value: DocumentType.VOTERS_CARD, label: "Voter's Card", needsFile: true },
  {
    value: DocumentType.DRIVERS_LICENSE,
    label: "Driver's License",
    needsFile: true,
  },
  { value: DocumentType.SELFIE, label: "Selfie", needsFile: true }, // Added Selfie here
  // Add other document types from your backend DocumentType enum as needed
  {
    value: DocumentType.OWNERSHIP_DOCUMENT,
    label: "Ownership Document",
    needsFile: true,
  },
  {
    value: DocumentType.CONSENT_DOCUMENT,
    label: "Consent Document",
    needsFile: true,
  },
  {
    value: DocumentType.UNDERTAKING_DOCUMENT,
    label: "Undertaking Document",
    needsFile: true,
  },
  {
    value: DocumentType.BUSINESS_REGISTRATION,
    label: "Business Registration",
    needsFile: true,
  },
  {
    value: DocumentType.TAX_CERTIFICATE,
    label: "Tax Certificate",
    needsFile: true,
  },
  { value: DocumentType.UTILITY_BILL, label: "Utility Bill", needsFile: true },
  {
    value: DocumentType.BANK_STATEMENT,
    label: "Bank Statement",
    needsFile: true,
  },
  { value: DocumentType.OTHER, label: "Other Document", needsFile: true },
];

const DOCUMENT_SIDES = [
  { value: DocumentSide.FRONT, label: "Front Side" },
  { value: DocumentSide.BACK, label: "Back Side" },
  { value: DocumentSide.SINGLE, label: "Single Document" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export default function VerificationUploader({
  className,
  onUploadComplete,
}: VerificationUploaderProps) {
  const {
    documents,
    isLoading,
    uploadDocument,
    submitDocumentNumber,
    submitVerification,
    refreshDocuments,
  } = useVerification();

  const router = useRouter();
  const [selectedDocumentType, setSelectedDocumentType] = useState<
    DocumentType | ""
  >("");
  const [selectedDocumentSide, setSelectedDocumentSide] = useState<
    DocumentSide | ""
  >("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [showSelfieUpload, setShowSelfieUpload] = useState(false);
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{
      documentType: DocumentType;
      documentSide?: DocumentSide;
      url: string;
      name: string;
      size: number;
      key: string;
    }>
  >([]); // NEW

  // UploadThing hooks // NEW
  const { startUpload: startDocumentUpload, isUploading: isDocumentUploading } =
    useUploadThing(
      // NEW
      "verificationDocuments", // NEW
      {
        // NEW
        onClientUploadComplete: (files) => {
          // NEW
          console.log("Document upload completed:", files); // NEW
          if (files && files.length > 0) {
            // NEW
            const file = files[0]; // NEW
            setUploadedFiles((prev) => [
              ...prev,
              {
                // NEW
                documentType: form.watch("documentType"), // NEW
                documentSide: form.watch("documentSide"), // NEW
                url: file.url, // NEW
                name: file.name, // NEW
                size: file.size, // NEW
                key: file.key, // NEW
              },
            ]); // NEW
          } // NEW
          toast.success("Document uploaded successfully!"); // NEW
        }, // NEW
        onUploadError: (error) => {
          // NEW
          console.error("Document upload error:", error); // NEW
          toast.error(`Upload failed: ${error.message}`); // NEW
        }, // NEW
      } // NEW
    ); // NEW

  const { startUpload: startSelfieUpload, isUploading: isSelfieUploading } =
    useUploadThing(
      // NEW
      "selfieUpload", // NEW
      {
        // NEW
        onClientUploadComplete: (files) => {
          // NEW
          console.log("Selfie upload completed:", files); // NEW
          if (files && files.length > 0) {
            // NEW
            const file = files[0]; // NEW
            setUploadedFiles((prev) => [
              ...prev,
              {
                // NEW
                documentType: DocumentType.SELFIE, // NEW
                documentSide: DocumentSide.SINGLE, // NEW
                url: file.url, // NEW
                name: file.name, // NEW
                size: file.size, // NEW
                key: file.key, // NEW
              },
            ]); // NEW
          } // NEW
          toast.success("Selfie uploaded successfully!"); // NEW
        }, // NEW
        onUploadError: (error) => {
          // NEW
          console.error("Selfie upload error:", error); // NEW
          toast.error(`Upload failed: ${error.message}`); // NEW
        }, // NEW
      } // NEW
    ); // NEW

  // const form = useForm<VerificationFormData>({
  //   resolver: zodResolver(verificationSchema),
  //   defaultValues: {
  //     documentType: DocumentType.NIN,
  //     documentSide: DocumentSide.SINGLE,
  //     documentNumber: "",
  //   },
  // });

   const form = useForm<CurrentDocumentFormData>({
    resolver: zodResolver(currentDocumentFormSchema),
    defaultValues: {
      documentType: undefined, // Start with no selection
      documentSide: DocumentSide.SINGLE, // Default to single
      documentNumber: "",
    },
  });

  // const selectedDocumentType = form.watch("documentType");
  const selectedDocument = DOCUMENT_TYPES.find(
    (doc) => doc.value === selectedDocumentType
  );
  const requiresUpload = selectedDocument?.needsFile || false;
  const selectedDocumentConfig = DOCUMENT_TYPES.find(
    (doc) => doc.value === selectedDocumentType
  );
  const needsFile = selectedDocumentConfig?.needsFile ?? false;
  const needsSides =
    selectedDocumentType === DocumentType.VOTERS_CARD ||
    selectedDocumentType === DocumentType.DRIVERS_LICENSE;

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        alert(
          `${file.name} is not a supported file type. Please upload JPEG, PNG, WebP, or PDF files.`
        );
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        alert(`${file.name} is too large. Maximum file size is 10MB.`);
        continue;
      }

      newFiles.push({
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: "pending",
      });
    }

    setUploadFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setUploadFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUpload = async () => {
    if (!selectedDocumentType) {
      alert("Please select a document type");
      return;
    }

    if (needsFile && uploadFiles.length === 0) {
      alert("Please select files to upload");
      return;
    }

    if (!needsFile && !documentNumber.trim()) {
      alert("Please enter the document number");
      return;
    }

    if (needsSides && !selectedDocumentSide) {
      alert("Please select the document side");
      return;
    }

    try {
      if (needsFile) {
        // Upload files
        for (let i = 0; i < uploadFiles.length; i++) {
          const fileData = uploadFiles[i];

          setUploadFiles((prev) => {
            const newFiles = [...prev];
            newFiles[i] = { ...newFiles[i], status: "uploading" };
            return newFiles;
          });

          const formData = new FormData();
          formData.append("file", fileData.file);
          formData.append("documentType", selectedDocumentType);
          if (needsSides) {
            formData.append("documentSide", selectedDocumentSide as string);
          }
          if (notes.trim()) {
            formData.append("notes", notes);
          }

          // Simulate upload progress
          const uploadInterval = setInterval(() => {
            setUploadFiles((prev) => {
              const newFiles = [...prev];
              if (newFiles[i] && newFiles[i].progress < 90) {
                newFiles[i] = {
                  ...newFiles[i],
                  progress: newFiles[i].progress + 10,
                };
              }
              return newFiles;
            });
          }, 200);

          try {
            await uploadDocument(
              fileData.file,
              selectedDocumentType,
              needsSides ? selectedDocumentSide : undefined
            );

            clearInterval(uploadInterval);
            setUploadFiles((prev) => {
              const newFiles = [...prev];
              newFiles[i] = {
                ...newFiles[i],
                status: "success",
                progress: 100,
              };
              return newFiles;
            });
          } catch (error) {
            clearInterval(uploadInterval);
            setUploadFiles((prev) => {
              const newFiles = [...prev];
              newFiles[i] = {
                ...newFiles[i],
                status: "error",
                error: error instanceof Error ? error.message : "Upload failed",
              };
              return newFiles;
            });
          }
        }
      } else {
        // Upload document by ID
        await submitDocumentNumber(
          selectedDocumentType,
          documentNumber.trim()
          // notes: notes.trim() || undefined,
        );
      }

      // Reset form
      setSelectedDocumentType("");
      setSelectedDocumentSide("");
      setDocumentNumber("");
      setNotes("");
      setUploadFiles([]);

      await refreshDocuments();
      onUploadComplete?.();
    } catch (error) {
      console.error("Upload error:", error);
      alert(error instanceof Error ? error.message : "Upload failed");
    }
  };

  // const handleSelfieUpload = async () => {
  //   if (uploadFiles.length === 0) {
  //     alert("Please select a selfie to upload");
  //     return;
  //   }

  //   const fileData = uploadFiles[0];
  //   try {
  //     setUploadFiles((prev) => {
  //       const newFiles = [...prev];
  //       newFiles[0] = { ...newFiles[0], status: "uploading" };
  //       return newFiles;
  //     });

  //     // await uploadDocument(formData);
  //     await uploadDocument(fileData.file, DocumentType.SELFIE);

  //     setUploadFiles((prev) => {
  //       const newFiles = [...prev];
  //       newFiles[0] = { ...newFiles[0], status: "success", progress: 100 };
  //       return newFiles;
  //     });

  //     setShowSelfieUpload(false);
  //     setUploadFiles([]);
  //     setNotes("");

  //     await refreshDocuments();
  //     onUploadComplete?.();
  //   } catch (error) {
  //     setUploadFiles((prev) => {
  //       const newFiles = [...prev];
  //       newFiles[0] = {
  //         ...newFiles[0],
  //         status: "error",
  //         error: error instanceof Error ? error.message : "Upload failed",
  //       };
  //       return newFiles;
  //     });
  //   }
  // };

  const handleDocumentUpload = async (files: FileList | null) => {
    // NEW
    if (!files || files.length === 0) return; // NEW
    const file = files[0]; // NEW
    // Validate file type // NEW
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ]; // NEW
    if (!allowedTypes.includes(file.type)) {
      // NEW
      toast.error("Please upload a valid image (JPEG, PNG) or PDF file"); // NEW
      return; // NEW
    } // NEW
    // Validate file size (max 8MB) // NEW
    const maxSize = 8 * 1024 * 1024; // 8MB // NEW
    if (file.size > maxSize) {
      // NEW
      toast.error("File size must be less than 8MB"); // NEW
      return; // NEW
    } // NEW
    await startDocumentUpload([file]); // NEW
  }; // NEW

  const handleSelfieUpload = async (files: FileList | null) => {
    // NEW
    if (!files || files.length === 0) return; // NEW
    const file = files[0]; // NEW
    // Validate file type (only images for selfies) // NEW
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"]; // NEW
    if (!allowedTypes.includes(file.type)) {
      // NEW
      toast.error("Please upload a valid image (JPEG, PNG) for your selfie"); // NEW
      return; // NEW
    } // NEW
    // Validate file size (max 4MB for selfies) // NEW
    const maxSize = 4 * 1024 * 1024; // 4MB // NEW
    if (file.size > maxSize) {
      // NEW
      toast.error("Selfie file size must be less than 4MB"); // NEW
      return; // NEW
    } // NEW
    await startSelfieUpload([file]); // NEW
  }; // NEW

  const removeUploadedFile = (index: number) => {
    // NEW
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index)); // NEW
  }; // NEW

  // const onSubmit = async (data: VerificationFormData) => {
  //   try {
  //     setIsSubmitting(true);

  //     // Find uploaded files for this document
  //     const documentFiles = uploadedFiles.filter(
  //       (file) =>
  //         file.documentType === data.documentType &&
  //         file.documentSide === data.documentSide
  //     ); // MODIFIED

  //     // For documents that require upload, ensure files are uploaded
  //     if (requiresUpload && documentFiles.length === 0) {
  //       toast.error("Please upload the required document files");
  //       return;
  //     } // NEW

  //     // For ID-only documents, ensure document number is provided
  //     if (!requiresUpload && !data.documentNumber?.trim()) {
  //       toast.error("Please provide the document number");
  //       return;
  //     } // NEW

  //     // Find selfie file
  //     const selfieFile = uploadedFiles.find(
  //       (file) => file.documentType === DocumentType.SELFIE
  //     ); // NEW
  //     if (!selfieFile) {
  //       // NEW
  //       toast.error("Please upload a selfie for identity verification"); // NEW
  //       return; // NEW
  //     } // NEW

  //     // Prepare verification data
  //     const verificationData = {
  //       // MODIFIED
  //       documentType: data.documentType, // MODIFIED
  //       documentSide: data.documentSide, // MODIFIED
  //       documentNumber: data.documentNumber, // MODIFIED
  //       fileUrl: documentFiles[0]?.url, // MODIFIED
  //       fileName: documentFiles[0]?.name, // MODIFIED
  //       fileSizeBytes: documentFiles[0]?.size, // NEW
  //       mimeType: documentFiles[0]?.name.endsWith(".pdf")
  //         ? "application/pdf"
  //         : "image/jpeg", // NEW
  //       selfieUrl: selfieFile.url, // NEW
  //       selfieFileName: selfieFile.name, // NEW
  //       selfieFileSize: selfieFile.size, // NEW
  //     }; // MODIFIED

  //     await submitVerification(verificationData); // MODIFIED

  //     toast.success("Verification documents submitted successfully!");
  //     router.push("/dashboard/profile");
  //   } catch (error) {
  //     console.error("Verification submission error:", error);
  //     toast.error("Failed to submit verification documents");
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  const formatFileSize = (bytes: number) => {
    // NEW
    if (bytes === 0) return "0 Bytes"; // NEW
    const k = 1024; // NEW
    const sizes = ["Bytes", "KB", "MB", "GB"]; // NEW
    const i = Math.floor(Math.log(bytes) / Math.log(k)); // NEW
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]; // NEW
  }; // NEW

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.PENDING:
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        );
      case DocumentStatus.APPROVED:
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        );
      case DocumentStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>;
      case DocumentStatus.EXPIRED:
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            Expired
          </Badge>
        );
      default:
        return null;
    }
  };

  const getDocumentTypeLabel = (type: DocumentType) => {
    return DOCUMENT_TYPES.find((doc) => doc.value === type)?.label || type;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Existing Documents */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Your Documents
            </CardTitle>
            <CardDescription>
              View the status of your uploaded verification documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {doc.documentType === DocumentType.SELFIE ? (
                        <Camera className="h-5 w-5 text-gray-600" />
                      ) : (
                        <FileText className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {getDocumentTypeLabel(doc.documentType)}
                      </p>
                      {doc.documentSide && (
                        <p className="text-sm text-gray-600">
                          {
                            DOCUMENT_SIDES.find(
                              (side) => side.value === doc.documentSide
                            )?.label
                          }
                        </p>
                      )}
                      {doc.documentNumber && (
                        <p className="text-sm text-gray-600">
                          ID: {doc.documentNumber}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(doc.status)}
                    {doc.status === DocumentStatus.APPROVED && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    {doc.status === DocumentStatus.REJECTED && (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload New Document */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Verification Document
          </CardTitle>
          <CardDescription>
            Upload a government-issued ID to verify your identity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Document Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="documentType">Document Type</Label>
            <Select
              value={selectedDocumentType}
              onValueChange={(value) =>
                setSelectedDocumentType(value as DocumentType)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((docType) => (
                  <SelectItem key={docType.value} value={docType.value}>
                    {docType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document Number Input (for ID-only documents) */}
          {selectedDocumentType && !needsFile && (
            <div className="space-y-2">
              <Label htmlFor="documentNumber">Document Number</Label>
              <Input
                id="documentNumber"
                type="text"
                placeholder="Enter your document number"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
              />
            </div>
          )}

          {/* Document Side Selection (for documents with sides) */}
          {needsFile && needsSides && (
            <div className="space-y-2">
              <Label htmlFor="documentSide">Document Side</Label>
              <Select
                value={selectedDocumentSide}
                onValueChange={(value) =>
                  setSelectedDocumentSide(value as DocumentSide)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document side" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_SIDES.filter(
                    (side) => side.value !== DocumentSide.SINGLE
                  ).map((side) => (
                    <SelectItem key={side.value} value={side.value}>
                      {side.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* File Upload Area (for documents that need files) */}
          {needsFile && (
            <div className="space-y-4">
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                  dragOver
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <p className="text-lg font-medium">
                    Drop files here or click to upload
                  </p>
                  <p className="text-sm text-gray-600">
                    Supports JPEG, PNG, WebP, and PDF files up to 10MB
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept={ACCEPTED_FILE_TYPES.join(",")}
                  // onChange={(e) => handleFileSelect(e.target.files)}
                  onChange={(e) => handleDocumentUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                  disabled={isDocumentUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                >
                  Select Files
                </Button>
              </div>

              {/* File Preview */}
              {uploadFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadFiles.map((fileData, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        {fileData.file.type.startsWith("image/") ? (
                          <img
                            src={fileData.preview}
                            alt="Preview"
                            className="h-16 w-16 object-cover rounded"
                          />
                        ) : (
                          <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center">
                            <FileText className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {fileData.file.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {fileData.status === "uploading" && (
                          <Progress
                            value={fileData.progress}
                            className="mt-1"
                          />
                        )}
                        {fileData.status === "error" && (
                          <p className="text-sm text-red-600 mt-1">
                            {fileData.error}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {fileData.status === "success" && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        {fileData.status === "error" && (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                        {fileData.status === "uploading" && (
                          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          disabled={fileData.status === "uploading"}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional information about your document..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={
              !selectedDocumentType ||
              (needsFile && uploadFiles.length === 0) ||
              (!needsFile && !documentNumber.trim()) ||
              (needsSides && !selectedDocumentSide) ||
              isLoading ||
              uploadFiles.some((f) => f.status === "uploading")
            }
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Selfie Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Selfie Verification
          </CardTitle>
          <CardDescription>
            Upload a clear selfie for identity verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showSelfieUpload ? (
            <div className="text-center py-8">
              <Camera className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-lg font-medium mb-2">Upload Your Selfie</p>
              <p className="text-gray-600 mb-4">
                Take a clear photo of yourself for verification
              </p>
              <Button onClick={() => setShowSelfieUpload(true)}>
                Upload Selfie
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                  dragOver
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Camera className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <p className="text-lg font-medium">
                    Drop your selfie here or click to upload
                  </p>
                  <p className="text-sm text-gray-600">
                    Supports JPEG, PNG, and WebP files up to 10MB
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  // onChange={(e) => handleFileSelect(e.target.files)}
                  onChange={(e) => handleDocumentUpload(e.target.files)}
                  className="hidden"
                  id="selfie-upload"
                  disabled={isDocumentUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={() =>
                    document.getElementById("selfie-upload")?.click()
                  }
                >
                  Select Selfie
                </Button>
              </div>

              {uploadFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadFiles.map((fileData, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <img
                        src={fileData.preview}
                        alt="Selfie preview"
                        className="h-16 w-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {fileData.file.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {fileData.status === "uploading" && (
                          <Progress
                            value={fileData.progress}
                            className="mt-1"
                          />
                        )}
                        {fileData.status === "error" && (
                          <p className="text-sm text-red-600 mt-1">
                            {fileData.error}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {fileData.status === "success" && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        {fileData.status === "error" && (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                        {fileData.status === "uploading" && (
                          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          disabled={fileData.status === "uploading"}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

               <div className="space-y-2">
                <Label htmlFor="selfie-notes">
                  Additional Notes (Optional)
                </Label>
                <Textarea
                  id="selfie-notes"
                  placeholder="Add any additional information..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* <div className="flex gap-2">
                <Button
                  onClick={handleSelfieUpload}
                  disabled={
                    uploadFiles.length === 0 ||
                    isLoading ||
                    uploadFiles.some((f) => f.status === "uploading")
                  }
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Selfie
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSelfieUpload(false);
                    setUploadFiles([]);
                    setNotes("");
                  }}
                >
                  Cancel
                </Button> */}
              {/* </div>  */}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Tips for better verification:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Ensure documents are clear and readable</li>
            <li>• Make sure all corners of the document are visible</li>
            <li>• Use good lighting and avoid shadows</li>
            <li>
              • For selfies, ensure your face is clearly visible and matches
              your ID
            </li>
            <li>• Upload high-quality images (avoid blurry photos)</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
