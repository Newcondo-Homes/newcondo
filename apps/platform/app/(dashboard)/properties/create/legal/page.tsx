// apps/platform/app/(dashboard)/properties/create/legal/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Button } from "@newcondo/ui/components/button";
import { Alert, AlertDescription } from "@newcondo/ui/components/alert";
import { Separator } from "@newcondo/ui/components/separator";

// FIX: import each component with the correct named/default export
import { OwnershipProofUpload } from "@/components/legal/OwnershipProofUpload";
import ConsentDocumentForm from "@/components/legal/ConsentDocumentForm";
import { AgentPermissionForm } from "@/components/legal/AgentPermissionForm";
import { UndertakingForm } from "@/components/legal/UndertakingForm";
import { LegalDocumentsList } from "@/components/legal/LegalDocumentsList";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, FileCheck, AlertTriangle, CheckCircle } from "lucide-react";

// ─── Types matching LegalDocumentsList's Document interface ──────────────────

// LegalDocumentsList.Document requires these fields — no arbitrary `type` key
interface LegalDocument {
  id: string;
  documentType: string;       // ← 'type' was wrong; this is the correct field name
  fileName?: string;
  fileUrl?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  verificationNotes?: string;
  isRequired: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  documentSide?: "FRONT" | "BACK" | "SINGLE";
  documentNumber?: string;
  pageNumber?: number;
  propertyId?: string;
}

// ─── Page state ───────────────────────────────────────────────────────────────

// Track uploaded document IDs instead of raw File objects —
// OwnershipProofUpload and AgentPermissionForm call their own APIs and
// return document records, not File handles.
interface UploadedDocs {
  ownershipDocumentId: string | null;
  consentDocumentId: string | null;
  agentPermissionSubmitted: boolean;
  undertakingDocumentId: string | null;
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

export default function PropertyCreateLegalPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocs>({
    ownershipDocumentId: null,
    consentDocumentId: null,
    agentPermissionSubmitted: false,
    undertakingDocumentId: null,
    termsAccepted: false,
    privacyAccepted: false,
  });

  // Collected document records to show in LegalDocumentsList
  const [documents, setDocuments] = useState<LegalDocument[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isAgent = user?.role === "AGENT";
  const isOwner = user?.role === "OWNER";

  // ── Helpers ────────────────────────────────────────────────────────────────

  const addDocument = (doc: LegalDocument) => {
    setDocuments((prev) => {
      const exists = prev.find((d) => d.id === doc.id);
      return exists ? prev : [...prev, doc];
    });
  };

  const removeDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (isOwner && !uploadedDocs.ownershipDocumentId) {
      newErrors.ownershipProof = "Proof of ownership is required";
    }
    if (isAgent && !uploadedDocs.consentDocumentId) {
      newErrors.consentDocument = "Property owner consent is required";
    }
    if (isAgent && !uploadedDocs.agentPermissionSubmitted) {
      newErrors.agentPermission = "Agent permission form must be submitted";
    }
    if (!uploadedDocs.undertakingDocumentId) {
      newErrors.undertaking = "Legal undertaking must be completed";
    }
    if (!uploadedDocs.termsAccepted) {
      newErrors.terms = "Terms of service must be accepted";
    }
    if (!uploadedDocs.privacyAccepted) {
      newErrors.privacy = "Privacy policy must be accepted";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      router.push("/dashboard/properties/create/success");
    } catch (error) {
      console.error("Error submitting legal documents:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const completionPercentage = (): number => {
    let completed = 0;
    let total = 0;

    if (isOwner) {
      total += 1;
      if (uploadedDocs.ownershipDocumentId) completed += 1;
    }
    if (isAgent) {
      total += 2;
      if (uploadedDocs.consentDocumentId) completed += 1;
      if (uploadedDocs.agentPermissionSubmitted) completed += 1;
    }

    total += 3;
    if (uploadedDocs.undertakingDocumentId) completed += 1;
    if (uploadedDocs.termsAccepted) completed += 1;
    if (uploadedDocs.privacyAccepted) completed += 1;

    return Math.round((completed / total) * 100);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Legal Documents</h1>
          <p className="text-muted-foreground">
            Complete legal requirements to publish your property
          </p>
        </div>
      </div>

      {/* Progress */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Completion Progress</span>
            <span className="text-sm text-muted-foreground">
              {completionPercentage()}% complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage()}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Requirements notice */}
      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {isAgent
            ? "As an agent, you must provide property owner consent and submit the agent permission form before listing properties."
            : "As a property owner, you must provide proof of ownership and accept our legal undertakings."}
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">

        {/* ── Owner: Ownership proof ─────────────────────────────────────── */}
        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Ownership Documentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* FIX 1: OwnershipProofUpload doesn't have onFileUpload/error props.
                  It uses onUploadComplete (receives an OwnershipDocument record)
                  and onRemoveDocument (receives a documentId string). */}
              <OwnershipProofUpload
                onUploadComplete={(doc) => {
                  setUploadedDocs((prev) => ({
                    ...prev,
                    ownershipDocumentId: doc.id,
                  }));
                  addDocument({
                    id: doc.id,
                    documentType: "OWNERSHIP_DOCUMENT",
                    fileName: doc.fileName,
                    fileUrl: doc.fileUrl,
                    fileSizeBytes: doc.fileSizeBytes,
                    status: doc.status,
                    verificationNotes: doc.verificationNotes,
                    isRequired: true,
                    createdAt: doc.createdAt,
                    updatedAt: doc.createdAt,
                  });
                  setErrors((e) => ({ ...e, ownershipProof: "" }));
                }}
                onRemoveDocument={(docId) => {
                  setUploadedDocs((prev) => ({ ...prev, ownershipDocumentId: null }));
                  removeDocument(docId);
                }}
              />
              {errors.ownershipProof && (
                <p className="text-sm text-red-600 mt-2">{errors.ownershipProof}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Agent: Consent document ────────────────────────────────────── */}
        {isAgent && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Property Owner Consent
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* FIX 2: ConsentDocumentForm expects { properties, onSubmit, isLoading }.
                    It handles its own file upload internally. We listen via onSubmit. */}
                <ConsentDocumentForm
                  properties={[]}          // pass real properties array if available
                  onSubmit={async () => {
                    // data includes the form fields; treat submission as consent provided
                    setUploadedDocs((prev) => ({
                      ...prev,
                      // Use a placeholder ID since ConsentDocumentForm manages upload itself
                      consentDocumentId: `consent-${Date.now()}`,
                    }));
                    setErrors((e) => ({ ...e, consentDocument: "" }));
                  }}
                />
                {errors.consentDocument && (
                  <p className="text-sm text-red-600 mt-2">{errors.consentDocument}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Agent Permission
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* FIX 3: AgentPermissionForm expects { propertyId, onSubmit }.
                    It handles document upload internally via UploadDropzone. */}
                <AgentPermissionForm
                  propertyId=""            // pass real propertyId if available
                  onSubmit={() => {
                    setUploadedDocs((prev) => ({
                      ...prev,
                      agentPermissionSubmitted: true,
                    }));
                    setErrors((e) => ({ ...e, agentPermission: "" }));
                  }}
                />
                {errors.agentPermission && (
                  <p className="text-sm text-red-600 mt-2">{errors.agentPermission}</p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* ── Legal Undertaking ──────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Legal Undertaking
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* FIX 4: UndertakingForm expects { propertyId, onSuccess, onCancel }.
                onSuccess receives a documentId string, not (accepted, document). */}
            <UndertakingForm
              onSuccess={(documentId: string) => {
                setUploadedDocs((prev) => ({
                  ...prev,
                  undertakingDocumentId: documentId,
                }));
                addDocument({
                  id: documentId,
                  documentType: "UNDERTAKING_DOCUMENT",
                  status: "PENDING",
                  isRequired: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                setErrors((e) => ({ ...e, undertaking: "" }));
              }}
            />
            {errors.undertaking && (
              <p className="text-sm text-red-600 mt-2">{errors.undertaking}</p>
            )}
          </CardContent>
        </Card>

        {/* ── Terms & Privacy ────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Legal Agreements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="terms"
                checked={uploadedDocs.termsAccepted}
                onChange={(e) =>
                  setUploadedDocs((prev) => ({ ...prev, termsAccepted: e.target.checked }))
                }
                className="rounded border-gray-300"
              />
              <label htmlFor="terms" className="text-sm">
                I have read and accept the{" "}
                <Button
                  variant="link"
                  className="h-auto p-0 text-primary"
                  onClick={() => router.push("/dashboard/profile/compliance/terms")}
                >
                  Terms of Service
                </Button>
              </label>
            </div>
            {errors.terms && <p className="text-sm text-red-600">{errors.terms}</p>}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="privacy"
                checked={uploadedDocs.privacyAccepted}
                onChange={(e) =>
                  setUploadedDocs((prev) => ({ ...prev, privacyAccepted: e.target.checked }))
                }
                className="rounded border-gray-300"
              />
              <label htmlFor="privacy" className="text-sm">
                I have read and accept the{" "}
                <Button
                  variant="link"
                  className="h-auto p-0 text-primary"
                  onClick={() => router.push("/dashboard/profile/compliance/privacy")}
                >
                  Privacy Policy
                </Button>
              </label>
            </div>
            {errors.privacy && <p className="text-sm text-red-600">{errors.privacy}</p>}
          </CardContent>
        </Card>

        {/* ── Uploaded documents list ────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {/* FIX 5: LegalDocumentsList.Document has no `type` field — it uses
                `documentType`. We pass the documents state which already uses
                the correct shape. Required props: documents, properties,
                userRole, and the four action callbacks. */}
            <LegalDocumentsList
              documents={documents}
              properties={[]}
              userRole={isAgent ? "AGENT" : "OWNER"}
              onUploadDocument={(documentType) => {
                // open relevant upload UI based on documentType
                console.log("upload requested for", documentType);
              }}
              onViewDocument={(docId) => {
                const doc = documents.find((d) => d.id === docId);
                if (doc?.fileUrl) window.open(doc.fileUrl, "_blank");
              }}
              onDownloadDocument={(docId) => {
                const doc = documents.find((d) => d.id === docId);
                if (doc?.fileUrl) {
                  const a = document.createElement("a");
                  a.href = doc.fileUrl;
                  a.download = doc.fileName ?? "document";
                  a.click();
                }
              }}
              onDeleteDocument={(docId) => {
                removeDocument(docId);
                // also clear the relevant uploadedDocs entry
                setUploadedDocs((prev) => {
                  const doc = documents.find((d) => d.id === docId);
                  if (!doc) return prev;
                  if (doc.documentType === "OWNERSHIP_DOCUMENT")
                    return { ...prev, ownershipDocumentId: null };
                  if (doc.documentType === "UNDERTAKING_DOCUMENT")
                    return { ...prev, undertakingDocumentId: null };
                  return prev;
                });
              }}
              onRetryUpload={(docId) => console.log("retry", docId)}
            />
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Submit actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/properties/create")}
        >
          Save as Draft
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || completionPercentage() < 100}
          className="min-w-32"
        >
          {isSubmitting ? "Submitting..." : "Submit for Review"}
        </Button>
      </div>
    </div>
  );
}