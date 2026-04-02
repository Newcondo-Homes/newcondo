'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Badge } from '@newcondo/ui/components/badge';
import { Progress } from '@newcondo/ui/components/progress';
import { Separator } from '@newcondo/ui/components/separator';
import { 
  Shield, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  X,
  Eye,
  Download,
  Upload,
  FileText,
  Scale,
  UserCheck,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@newcondo/ui/components/tabs';
import { DocumentStatus, DocumentType, VerificationStatus, UserType } from '@newcondo/db';

interface ComplianceData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    userType: UserType;
    verificationStatus: VerificationStatus;
    verifiedAt?: Date;
    isB2BCustomer: boolean;
  };
  documents: {
    id: string;
    documentType: DocumentType;
    status: DocumentStatus;
    isRequired: boolean;
    fileName?: string;
    fileUrl?: string;
    createdAt: Date;
    expiresAt?: Date;
  }[];
  agreements: {
    termsAccepted: boolean;
    termsAcceptedAt?: Date;
    privacyAccepted: boolean;
    privacyAcceptedAt?: Date;
    marketingConsent: boolean;
    dataProcessingConsent: boolean;
  };
  complianceScore: number;
  missingRequirements: string[];
  expiringDocuments: string[];
}

export default function ProfileCompliancePage() {
  const router = useRouter();
  const [compliance, setCompliance] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    try {
      const response = await fetch('/api/compliance/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch compliance data');
      }

      const data = await response.json();
      setCompliance(data);
    } catch (error) {
      console.error('Error fetching compliance data:', error);
      setError('Failed to load compliance information');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: DocumentStatus | VerificationStatus) => {
    switch (status) {
      case DocumentStatus.APPROVED:
      case VerificationStatus.VERIFIED:
        return 'bg-green-100 text-green-800 border-green-200';
      case DocumentStatus.REJECTED:
      case VerificationStatus.REJECTED:
        return 'bg-red-100 text-red-800 border-red-200';
      case DocumentStatus.EXPIRED:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: DocumentStatus | VerificationStatus) => {
    switch (status) {
      case DocumentStatus.APPROVED:
      case VerificationStatus.VERIFIED:
        return <CheckCircle className="h-4 w-4" />;
      case DocumentStatus.REJECTED:
      case VerificationStatus.REJECTED:
        return <X className="h-4 w-4" />;
      case DocumentStatus.EXPIRED:
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDocumentType = (type: DocumentType) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getComplianceScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRequiredDocuments = () => {
    if (!compliance) return [];
    
    const baseRequirements = [DocumentType.NIN, DocumentType.SELFIE];
    
    if (compliance.user.isB2BCustomer) {
      return [...baseRequirements, DocumentType.BUSINESS_REGISTRATION, DocumentType.TAX_CERTIFICATE];
    }
    
    return baseRequirements;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading compliance information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !compliance) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Failed to load compliance information'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Compliance Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor your verification status and legal compliance
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard/properties/legal-documents/upload')}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Documents
        </Button>
      </div>

      {/* Compliance Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Compliance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className={`text-3xl font-bold ${getComplianceScoreColor(compliance.complianceScore)}`}>
                {compliance.complianceScore}%
              </div>
              <Progress value={compliance.complianceScore} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {compliance.complianceScore >= 90 ? 'Fully compliant' :
                 compliance.complianceScore >= 70 ? 'Nearly compliant' :
                 'Needs attention'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(compliance.user.verificationStatus)}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(compliance.user.verificationStatus)}
                  {compliance.user.verificationStatus}
                </div>
              </Badge>
            </div>
            {compliance.user.verifiedAt && (
              <p className="text-sm text-muted-foreground mt-2">
                Verified on {new Date(compliance.user.verifiedAt).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Approved</span>
                <span className="font-medium text-green-600">
                  {compliance.documents.filter(d => d.status === DocumentStatus.APPROVED).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Pending</span>
                <span className="font-medium text-yellow-600">
                  {compliance.documents.filter(d => d.status === DocumentStatus.PENDING).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Rejected</span>
                <span className="font-medium text-red-600">
                  {compliance.documents.filter(d => d.status === DocumentStatus.REJECTED).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Legal Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {compliance.agreements.termsAccepted ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
                <span>Terms Accepted</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {compliance.agreements.privacyAccepted ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
                <span>Privacy Policy</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {compliance.missingRequirements.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Missing Requirements:</strong> {compliance.missingRequirements.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {compliance.expiringDocuments.length > 0 && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <strong>Documents Expiring Soon:</strong> {compliance.expiringDocuments.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="agreements">Legal Agreements</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Status
                </CardTitle>
                <CardDescription>
                  Track the status of all your uploaded documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...new Set([...getRequiredDocuments(), ...compliance.documents.map(d => d.documentType)])].map((docType) => {
                    const document = compliance.documents.find(d => d.documentType === docType);
                    const isRequired = getRequiredDocuments().includes(docType);
                    
                    return (
                      <div key={docType} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h4 className="font-medium">{formatDocumentType(docType)}</h4>
                            <p className="text-sm text-muted-foreground">
                              {isRequired ? 'Required' : 'Optional'} • {document?.fileName || 'Not uploaded'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {document ? (
                            <>
                              {document.status === 'APPROVED' && (
                                <Badge className={getStatusColor(document.status)}>
                                  <div className="flex items-center gap-1">
                                    {getStatusIcon(document.status)}
                                    Approved
                                  </div>
                                </Badge>
                              )}
                              {document.status === 'PENDING' && (
                                <Badge className={getStatusColor(document.status)}>
                                  <div className="flex items-center gap-1">
                                    {getStatusIcon(document.status)}
                                    Pending
                                  </div>
                                </Badge>
                              )}
                              {document.status === 'REJECTED' && (
                                <Badge className={getStatusColor(document.status)}>
                                  <div className="flex items-center gap-1">
                                    {getStatusIcon(document.status)}
                                    Rejected
                                  </div>
                                </Badge>
                              )}
                              {document.status === 'EXPIRED' && (
                                <Badge className={getStatusColor(document.status)}>
                                  <div className="flex items-center gap-1">
                                    {getStatusIcon(document.status)}
                                    Expired
                                  </div>
                                </Badge>
                              )}
                              {document.fileUrl && (
                                <Button variant="ghost" size="icon" onClick={() => window.open(document.fileUrl, '_blank')}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          ) : (
                            <Button onClick={() => router.push(`/dashboard/properties/legal-documents/upload?type=${docType}`)}>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agreements">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Legal Agreements
              </CardTitle>
              <CardDescription>
                Your acceptance of our terms and policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileCheck className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">Terms of Service</h4>
                      <p className="text-sm text-muted-foreground">
                        Last updated: {compliance.agreements.termsAcceptedAt ? new Date(compliance.agreements.termsAcceptedAt).toLocaleDateString() : 'Not accepted'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {compliance.agreements.termsAccepted ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                        Accepted
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                        Not Accepted
                      </Badge>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => window.open('/terms', '_blank')}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileCheck className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">Privacy Policy</h4>
                      <p className="text-sm text-muted-foreground">
                        Last updated: {compliance.agreements.privacyAcceptedAt ? new Date(compliance.agreements.privacyAcceptedAt).toLocaleDateString() : 'Not accepted'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {compliance.agreements.privacyAccepted ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                        Accepted
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                        Not Accepted
                      </Badge>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => window.open('/privacy', '_blank')}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">Data Processing Consent</h4>
                      <p className="text-sm text-muted-foreground">
                        Consent for processing your personal data
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {compliance.agreements.dataProcessingConsent ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                        Given
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                        Revoked
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                User Information
              </CardTitle>
              <CardDescription>
                Summary of your profile verification status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{compliance.user.name}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{compliance.user.email}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">User Type</span>
                  <span className="font-medium">{compliance.user.userType}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Verification Status</span>
                  <Badge className={getStatusColor(compliance.user.verificationStatus)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(compliance.user.verificationStatus)}
                      {compliance.user.verificationStatus}
                    </div>
                  </Badge>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Next Steps to Full Compliance</h4>
                <ul className="list-disc list-inside space-y-1">
                  {compliance.missingRequirements.length > 0 && (
                    <li>
                      <span className="font-medium text-red-600">Missing Documents:</span> Please upload your missing required documents.
                    </li>
                  )}
                  {compliance.expiringDocuments.length > 0 && (
                    <li>
                      <span className="font-medium text-orange-600">Expiring Documents:</span> Your {compliance.expiringDocuments.join(', ')} documents will expire soon. Please re-upload.
                    </li>
                  )}
                  {compliance.user.verificationStatus !== VerificationStatus.VERIFIED && (
                    <li>
                      <span className="font-medium text-yellow-600">Verification Pending:</span> Your account verification is currently under review. This process can take up to 48 hours.
                    </li>
                  )}
                  {compliance.agreements.termsAccepted === false && (
                    <li>
                      <span className="font-medium text-red-600">Legal Agreement:</span> You must accept our Terms of Service and Privacy Policy to be fully compliant.
                    </li>
                  )}
                  {compliance.complianceScore >= 90 && (
                    <li>
                      <span className="font-medium text-green-600">Congratulations!</span> Your account is fully compliant.
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}