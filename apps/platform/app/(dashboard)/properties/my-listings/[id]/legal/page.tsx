// apps/platform/app/(dashboard)/properties/my-listings/[id]/legal/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@newcondo/ui";
import { Button } from "@newcondo/ui";
import { useSession } from "@newcondo/auth/client";
import { Badge } from "@newcondo/ui";
import { Alert, AlertDescription } from "@newcondo/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@newcondo/ui";
import ConsentDocumentForm from "@/components/legal/ConsentDocumentForm";
import { OwnershipProofUpload } from "@/components/legal/OwnershipProofUpload";
import { AgentPermissionForm } from "@/components/legal/AgentPermissionForm";
import { UndertakingForm } from "@/components/legal/UndertakingForm";
import { LegalDocumentsList } from "@/components/legal/LegalDocumentsList";
import { ComplianceStatus } from "@/components/legal/ComplianceStatus";
import { useProperty } from "@/hooks/useProperties";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Info
} from "lucide-react";

interface LegalDocument {
  id: string;
  documentType: string;
  fileName?: string;
  fileUrl?: string;
  fileSizeBytes?: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  verificationNotes?: string;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
  documentSide?: "FRONT" | "BACK" | "SINGLE";
  documentNumber?: string;
  pageNumber?: number;
  propertyId?: string;
  expiresAt?: string;
}

interface PropertyLegal {
  id: string;
  propertyId: string;
  documents: LegalDocument[];
  complianceStatus: "PENDING" | "COMPLIANT" | "NON_COMPLIANT";
  lastUpdated: string;
}


export default function PropertyLegalPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const { data: session } = useSession();

  const user = session?.user

  if (!user) router.push('/dashboard');

  const { data: property, isLoading: propertyLoading } = useProperty(propertyId);

  const [legalData, setLegalData] = useState<PropertyLegal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchLegalData = async () => {
      setIsLoading(true);
      try {
        const mockLegalData: PropertyLegal = {
          id: "legal_" + propertyId,
          propertyId,
          complianceStatus: "PENDING",
          lastUpdated: new Date().toISOString(),
          documents: [
            {
              id: "doc1",
              documentType: "OWNERSHIP_DOCUMENT",
              fileName: "property_deed.pdf",
              fileUrl: "/documents/property_deed.pdf",
              status: "APPROVED",
              isRequired: true,
              createdAt: "2025-01-01T10:00:00Z",
              updatedAt: "2025-01-02T10:00:00Z",
            },
            {
              id: "doc2",
              documentType: "UNDERTAKING_DOCUMENT",
              fileName: "signed_undertaking.pdf",
              fileUrl: "/documents/signed_undertaking.pdf",
              status: "PENDING",
              isRequired: true,
              verificationNotes: "Signature verification in progress",
              createdAt: "2025-01-01T10:00:00Z",
              updatedAt: "2025-01-01T10:00:00Z",
            },
          ],
        };
        setLegalData(mockLegalData);
      } catch (error) {
        console.error("Error fetching legal data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (propertyId) fetchLegalData();
  }, [propertyId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading || propertyLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!property || !legalData) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Property or legal data not found. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }


  const userRole: "OWNER" | "AGENT" | "RENTER" =
    user?.role === "AGENT" ? "AGENT" :
      user?.role === "OWNER" ? "OWNER" : "RENTER";

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dashboard/properties/my-listings/${propertyId}`)}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Legal Compliance</h1>
          <p className="text-muted-foreground">
            {property.title} - Manage legal documents and compliance
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Compliance Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Compliance Status</span>
            <Badge className={getStatusColor(legalData.complianceStatus)}>
              {legalData.complianceStatus.replace('_', ' ')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ComplianceStatus
            userRole={userRole}
            userVerificationStatus={user?.verificationStatus ?? "PENDING"}
            documents={legalData.documents.map((d) => ({
              id: d.id,
              documentType: d.documentType,
              status: d.status as "PENDING" | "APPROVED" | "REJECTED",
              createdAt: d.createdAt,
              verificationNotes: d.verificationNotes,
            }))}
            onUploadDocument={(documentType) => {
              router.push(
                `/dashboard/properties/legal-documents/upload?propertyId=${propertyId}&type=${documentType}`
              );
            }}
            onViewDetails={() => setActiveTab("documents")}
          />
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="update">Update</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Status Overview</CardTitle>
              <CardDescription>
                A quick look at the status of all legal documents for this property.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {legalData.documents.length === 0 ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      No legal documents have been submitted for this property.
                    </AlertDescription>
                  </Alert>
                ) : (
                  legalData.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <span className="text-xl">{getStatusIcon(doc.status)}</span>
                        <div>
                          <p className="font-semibold">{doc.documentType.replace(/_/g, " ")}</p>
                          <p className="text-sm text-muted-foreground">
                            Status: <span className={getStatusColor(doc.status)}>{doc.status}</span>
                          </p>
                          {doc.verificationNotes && (
                            <p className="text-xs text-red-500 mt-1">Notes: {doc.verificationNotes}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <Button variant="ghost" size="sm" onClick={() => window.open(doc.fileUrl, "_blank")}>
                          View
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Legal Documents</CardTitle>
              <CardDescription>
                A comprehensive list of all documents associated with this property.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {legalData.documents.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No legal documents have been submitted for this property.
                  </AlertDescription>
                </Alert>
              ) : (
                <LegalDocumentsList
                  documents={legalData.documents}
                  properties={[{ id: propertyId, title: property.title, address: property.address }]}
                  userRole={userRole}
                  onUploadDocument={(documentType) => {
                    router.push(
                      `/dashboard/properties/legal-documents/upload?propertyId=${propertyId}&type=${documentType}`
                    );
                  }}
                  onViewDocument={(docId) => {
                    const doc = legalData.documents.find((d) => d.id === docId);
                    if (doc?.fileUrl) window.open(doc.fileUrl, "_blank");
                  }}
                  onDownloadDocument={(docId) => {
                    const doc = legalData.documents.find((d) => d.id === docId);
                    if (doc?.fileUrl) {
                      const a = window.document.createElement("a");
                      a.href = doc.fileUrl;
                      a.download = doc.fileName ?? "document";
                      a.click();
                    }
                  }}
                  onDeleteDocument={(docId) => {
                    setLegalData((prev) =>
                      prev
                        ? { ...prev, documents: prev.documents.filter((d) => d.id !== docId) }
                        : prev
                    );
                  }}
                  onRetryUpload={(docId) => {
                    const doc = legalData.documents.find((d) => d.id === docId);
                    if (doc) {
                      router.push(
                        `/dashboard/properties/legal-documents/upload?propertyId=${propertyId}&type=${doc.documentType}`
                      );
                    }
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="update" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Update Legal Documents</CardTitle>
              <CardDescription>
                Upload or re-upload the necessary legal documents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {user?.userType === "OWNER" && (
                  <OwnershipProofUpload
                    propertyId={propertyId}
                    onUploadComplete={(doc) => {
                      setLegalData((prev) =>
                        prev
                          ? {
                            ...prev,
                            documents: [
                              ...prev.documents,
                              {
                                id: doc.id,
                                documentType: "OWNERSHIP_DOCUMENT",
                                fileName: doc.fileName,
                                fileUrl: doc.fileUrl,
                                fileSizeBytes: doc.fileSizeBytes,
                                status: doc.status,
                                isRequired: true,
                                createdAt: doc.createdAt,
                                updatedAt: doc.createdAt,
                              },
                            ],
                          }
                          : prev
                      );
                    }}
                  />
                )}

                {user?.userType === "AGENT" && (
                  <ConsentDocumentForm
                    properties={[
                      {
                        id: propertyId,
                        title: property.title,
                        address: property.address,
                        city: property.city,
                        state: property.state,
                      },
                    ]}
                    onSubmit={async () => {
                      // TODO: handle consent form submission
                    }}
                  />
                )}

                {user?.userType === "AGENT" && (
                  <AgentPermissionForm
                    propertyId={propertyId}
                    onSubmit={() => {
                      // TODO: handle permission form submission
                    }}
                  />
                )}

                <UndertakingForm
                  propertyId={propertyId}
                  onSuccess={(documentId) => {
                    setLegalData((prev) =>
                      prev
                        ? {
                          ...prev,
                          documents: [
                            ...prev.documents,
                            {
                              id: documentId,
                              documentType: "UNDERTAKING_DOCUMENT",
                              status: "PENDING",
                              isRequired: true,
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString(),
                            },
                          ],
                        }
                        : prev
                    );
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}