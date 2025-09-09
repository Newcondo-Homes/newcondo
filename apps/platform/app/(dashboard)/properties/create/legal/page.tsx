// apps/platform/app/(dashboard)/properties/create/legal/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui";
import { Button } from "@newcondo/ui";
import { Alert, AlertDescription } from "@newcondo/ui";
import { Separator } from "@newcondo/ui";
import { ConsentDocumentForm } from "@/components/legal/ConsentDocumentForm";
import { OwnershipProofUpload } from "@/components/legal/OwnershipProofUpload";
import { AgentPermissionForm } from "@/components/legal/AgentPermissionForm";
import { UndertakingForm } from "@/components/legal/UndertakingForm";
import { LegalDocumentsList } from "@/components/legal/LegalDocumentsList";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, FileCheck, AlertTriangle, CheckCircle } from "lucide-react";

interface LegalFormData {
  ownershipProof: File | null;
  consentDocument: File | null;
  agentPermission: File | null;
  undertaking: {
    accepted: boolean;
    signedDocument: File | null;
  };
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

export default function PropertyCreateLegalPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState<LegalFormData>({
    ownershipProof: null,
    consentDocument: null,
    agentPermission: null,
    undertaking: {
      accepted: false,
      signedDocument: null
    },
    termsAccepted: false,
    privacyAccepted: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isAgent = user?.role === "AGENT";
  const isOwner = user?.role === "OWNER";

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Owner requirements
    if (isOwner && !formData.ownershipProof) {
      newErrors.ownershipProof = "Proof of ownership is required";
    }

    // Agent requirements
    if (isAgent) {
      if (!formData.consentDocument) {
        newErrors.consentDocument = "Property owner consent is required";
      }
      if (!formData.agentPermission) {
        newErrors.agentPermission = "Agent permission document is required";
      }
    }

    // Universal requirements
    if (!formData.undertaking.accepted) {
      newErrors.undertaking = "Legal undertaking must be accepted";
    }

    if (!formData.termsAccepted) {
      newErrors.terms = "Terms of service must be accepted";
    }

    if (!formData.privacyAccepted) {
      newErrors.privacy = "Privacy policy must be accepted";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Here you would submit the legal documents
      // This would typically upload files and create document records
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      // Redirect to property creation success or next step
      router.push("/dashboard/properties/create/success");
    } catch (error) {
      console.error("Error submitting legal documents:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const completionPercentage = () => {
    let completed = 0;
    let total = 0;

    // Owner documents
    if (isOwner) {
      total += 1;
      if (formData.ownershipProof) completed += 1;
    }

    // Agent documents
    if (isAgent) {
      total += 2;
      if (formData.consentDocument) completed += 1;
      if (formData.agentPermission) completed += 1;
    }

    // Universal requirements
    total += 3;
    if (formData.undertaking.accepted) completed += 1;
    if (formData.termsAccepted) completed += 1;
    if (formData.privacyAccepted) completed += 1;

    return Math.round((completed / total) * 100);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Legal Documents</h1>
          <p className="text-muted-foreground">
            Complete legal requirements to publish your property
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
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

      {/* Requirements Overview */}
      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {isAgent 
            ? "As an agent, you must provide property owner consent and agent permission documents before listing properties."
            : "As a property owner, you must provide proof of ownership and accept our legal undertakings."
          }
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {/* Owner-specific Documents */}
        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Ownership Documentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OwnershipProofUpload
                onFileUpload={(file) => setFormData(prev => ({ ...prev, ownershipProof: file }))}
                error={errors.ownershipProof}
              />
            </CardContent>
          </Card>
        )}

        {/* Agent-specific Documents */}
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
                <ConsentDocumentForm
                  onFileUpload={(file) => setFormData(prev => ({ ...prev, consentDocument: file }))}
                  error={errors.consentDocument}
                />
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
                <AgentPermissionForm
                  onFileUpload={(file) => setFormData(prev => ({ ...prev, agentPermission: file }))}
                  error={errors.agentPermission}
                />
              </CardContent>
            </Card>
          </>
        )}

        {/* Legal Undertaking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Legal Undertaking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UndertakingForm
              onAcceptanceChange={(accepted, document) => 
                setFormData(prev => ({ 
                  ...prev, 
                  undertaking: { accepted, signedDocument: document } 
                }))
              }
              error={errors.undertaking}
            />
          </CardContent>
        </Card>

        {/* Terms and Privacy Acceptance */}
        <Card>
          <CardHeader>
            <CardTitle>Legal Agreements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="terms"
                checked={formData.termsAccepted}
                onChange={(e) => setFormData(prev => ({ ...prev, termsAccepted: e.target.checked }))}
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
            {errors.terms && (
              <p className="text-sm text-red-600">{errors.terms}</p>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="privacy"
                checked={formData.privacyAccepted}
                onChange={(e) => setFormData(prev => ({ ...prev, privacyAccepted: e.target.checked }))}
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
            {errors.privacy && (
              <p className="text-sm text-red-600">{errors.privacy}</p>
            )}
          </CardContent>
        </Card>

        {/* Uploaded Documents List */}
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <LegalDocumentsList
              documents={[
                ...(formData.ownershipProof ? [{ type: "ownership", file: formData.ownershipProof }] : []),
                ...(formData.consentDocument ? [{ type: "consent", file: formData.consentDocument }] : []),
                ...(formData.agentPermission ? [{ type: "agent_permission", file: formData.agentPermission }] : []),
                ...(formData.undertaking.signedDocument ? [{ type: "undertaking", file: formData.undertaking.signedDocument }] : [])
              ]}
              onRemoveDocument={(type) => {
                setFormData(prev => ({
                  ...prev,
                  [type === "ownership" ? "ownershipProof" : 
                   type === "consent" ? "consentDocument" :
                   type === "agent_permission" ? "agentPermission" : "undertaking"]: 
                   type === "undertaking" ? { ...prev.undertaking, signedDocument: null } : null
                }));
              }}
            />
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Submit Actions */}
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