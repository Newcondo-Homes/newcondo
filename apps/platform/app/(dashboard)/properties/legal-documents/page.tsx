// apps/platform/app/(dashboard)/properties/legal-documents/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Badge } from '@newcondo/ui/components/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@newcondo/ui/components/tabs';
import { Progress } from '@newcondo/ui/components/progress';
import { Separator } from '@newcondo/ui/components/separator';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Download,
  Eye,
  Shield,
  AlertTriangle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

// Types based on Prisma schema
interface Document {
  id: string;
  documentType: string;
  documentSide?: string;
  documentNumber?: string;
  fileName?: string;
  fileUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  verificationNotes?: string;
  isRequired: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ComplianceStatus {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  dataProcessingConsent: boolean;
  marketingConsent: boolean;
  lastUpdated: Date;
}

export default function LegalDocumentsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [compliance, setCompliance] = useState<ComplianceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('documents');

  useEffect(() => {
    if (user) {
      fetchDocuments();
      fetchComplianceStatus();
    }
  }, [user]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
      } else {
        toast.error('Failed to load documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchComplianceStatus = async () => {
    try {
      const response = await fetch('/api/compliance/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCompliance(data.compliance);
      }
    } catch (error) {
      console.error('Error fetching compliance status:', error);
    }
  };

  const getDocumentStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      APPROVED: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Approved' },
      REJECTED: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Rejected' },
      EXPIRED: { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle, label: 'Expired' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const calculateCompletionPercentage = () => {
    if (documents.length === 0) return 0;
    
    const requiredDocs = documents.filter(doc => doc.isRequired);
    const completedDocs = requiredDocs.filter(doc => doc.status === 'APPROVED');
    
    const docProgress = requiredDocs.length > 0 ? (completedDocs.length / requiredDocs.length) * 70 : 0;
    const complianceProgress = compliance ? 
      (compliance.termsAccepted && compliance.privacyAccepted ? 30 : 0) : 0;
    
    return Math.round(docProgress + complianceProgress);
  };

  const getDocumentTypeDisplay = (type: string) => {
    const displayNames = {
      'NIN': 'National ID (NIN)',
      'PASSPORT': 'International Passport',
      'DRIVERS_LICENSE': 'Driver\'s License',
      'OWNERSHIP_DOCUMENT': 'Proof of Ownership',
      'CONSENT_DOCUMENT': 'Owner Consent Form',
      'UNDERTAKING_DOCUMENT': 'Legal Undertaking',
      'BUSINESS_REGISTRATION': 'Business Registration',
      'SELFIE': 'Identity Selfie'
    };
    
    return displayNames[type as keyof typeof displayNames] || type;
  };

  const requiredDocuments = documents.filter(doc => doc.isRequired);
  const optionalDocuments = documents.filter(doc => !doc.isRequired);
  const completionPercentage = calculateCompletionPercentage();

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Legal Documents & Compliance</h1>
          <p className="text-muted-foreground mt-2">
            Manage your legal documents and compliance requirements
          </p>
        </div>
        <Button onClick={() => router.push('/properties/legal-documents/upload')}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Documents
        </Button>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Compliance Progress
          </CardTitle>
          <CardDescription>
            Complete your legal requirements to list properties
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Overall Completion</span>
                <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="w-full" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {documents.filter(d => d.status === 'APPROVED').length}
                </div>
                <div className="text-sm text-muted-foreground">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {documents.filter(d => d.status === 'PENDING').length}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {documents.filter(d => d.status === 'REJECTED').length}
                </div>
                <div className="text-sm text-muted-foreground">Rejected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {compliance?.termsAccepted && compliance?.privacyAccepted ? 'Complete' : 'Pending'}
                </div>
                <div className="text-sm text-muted-foreground">Compliance</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          {/* Required Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Required Documents
              </CardTitle>
              <CardDescription>
                These documents are mandatory for property listings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {requiredDocuments.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No required documents found</p>
                  <Button 
                    className="mt-4"
                    onClick={() => router.push('/properties/legal-documents/upload')}
                  >
                    Upload First Document
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {requiredDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <FileText className="w-8 h-8 text-blue-500" />
                        <div>
                          <h4 className="font-medium">{getDocumentTypeDisplay(doc.documentType)}</h4>
                          <p className="text-sm text-muted-foreground">
                            {doc.fileName || 'Document number provided'}
                          </p>
                          {doc.verificationNotes && (
                            <p className="text-sm text-red-600 mt-1">{doc.verificationNotes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getDocumentStatusBadge(doc.status)}
                        <div className="flex space-x-2">
                          {doc.fileUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(doc.fileUrl, '_blank')}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/properties/legal-documents/${doc.id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Optional Documents */}
          {optionalDocuments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-500" />
                  Optional Documents
                </CardTitle>
                <CardDescription>
                  Additional documents that may be helpful
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {optionalDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <FileText className="w-8 h-8 text-gray-500" />
                        <div>
                          <h4 className="font-medium">{getDocumentTypeDisplay(doc.documentType)}</h4>
                          <p className="text-sm text-muted-foreground">
                            {doc.fileName || 'Document number provided'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getDocumentStatusBadge(doc.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/properties/legal-documents/${doc.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Legal Compliance</CardTitle>
              <CardDescription>
                Review and accept legal agreements and policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  className="w-full justify-between"
                  variant={compliance?.termsAccepted ? "outline" : "default"}
                  onClick={() => router.push('/profile/compliance/terms')}
                >
                  <span>Terms and Conditions</span>
                  {compliance?.termsAccepted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </Button>
                
                <Button
                  className="w-full justify-between"
                  variant={compliance?.privacyAccepted ? "outline" : "default"}
                  onClick={() => router.push('/profile/compliance/privacy')}
                >
                  <span>Privacy Policy</span>
                  {compliance?.privacyAccepted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </Button>
                
                <Button
                  className="w-full justify-between"
                  variant="outline"
                  onClick={() => router.push('/profile/compliance')}
                >
                  <span>View All Compliance Settings</span>
                  <Eye className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Templates</CardTitle>
              <CardDescription>
                Download legal document templates for completion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Download className="w-8 h-8 text-blue-500" />
                    <div>
                      <h4 className="font-medium">Legal Undertaking Form</h4>
                      <p className="text-sm text-muted-foreground">
                        Standard legal undertaking document template
                      </p>
                    </div>
                  </div>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Download className="w-8 h-8 text-green-500" />
                    <div>
                      <h4 className="font-medium">Property Owner Consent Form</h4>
                      <p className="text-sm text-muted-foreground">
                        Consent form for agent property listings
                      </p>
                    </div>
                  </div>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}