// apps/platform/app/(dashboard)/properties/legal-documents/upload/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Image as ImageIcon,
  Shield,
  Info,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { UploadButton } from '@uploadthing/react';
import { useAuthStore } from '@/store/authStore';
import { usePropertyStore } from '@/store/propertyStore';
import { api } from '@/lib/api/client';
import { getFileIcon } from '@/lib/utils/helpers';
import { DocumentType as PrismaDocumentType } from '@newcondo/db';

interface DocumentType {
  key: PrismaDocumentType;
  name: string;
  description: string;
  required: boolean;
  acceptedFormats: string[];
  maxSizeBytes: number;
  requiresUpload: boolean;
  requiresNumber: boolean;
  hasExpiry: boolean;
  adminVerificationRequired: boolean;
}

interface UploadedFile {
  url: string;
  name: string;
  size: number;
  type: string;
}

const DOCUMENT_TYPES: DocumentType[] = [
  {
    key: PrismaDocumentType.NIN,
    name: 'National Identification Number (NIN)',
    description: 'Your Nigerian National ID number, as it appears on your card or slip.',
    required: true,
    acceptedFormats: [],
    maxSizeBytes: 0,
    requiresUpload: false,
    requiresNumber: true,
    hasExpiry: false,
    adminVerificationRequired: true
  },
  {
    key: PrismaDocumentType.BVN,
    name: 'Bank Verification Number (BVN)',
    description: 'Your Bank Verification Number for financial verification. It is a unique 11-digit number.',
    required: false,
    acceptedFormats: [],
    maxSizeBytes: 0,
    requiresUpload: false,
    requiresNumber: true,
    hasExpiry: false,
    adminVerificationRequired: true
  },
  {
    key: PrismaDocumentType.OWNERSHIP_DOCUMENT,
    name: 'Certificate of Occupancy / Deed of Assignment',
    description: 'Legal proof of property ownership, such as a Certificate of Occupancy or Deed of Assignment. This is mandatory for property owners.',
    required: true,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeBytes: 10 * 1024 * 1024,
    requiresUpload: true,
    requiresNumber: false,
    hasExpiry: false,
    adminVerificationRequired: true
  },
  {
    key: PrismaDocumentType.CONSENT_DOCUMENT,
    name: 'Property Owner Consent Form',
    description: 'Signed consent from a property owner to an agent to list and manage their property. Use this if you are an agent.',
    required: false,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeBytes: 5 * 1024 * 1024,
    requiresUpload: true,
    requiresNumber: false,
    hasExpiry: false,
    adminVerificationRequired: true
  },
  {
    key: PrismaDocumentType.UNDERTAKING_DOCUMENT,
    name: 'Legal Undertaking Document',
    description: 'A signed legal document acknowledging your compliance with NewCondo platform terms and conditions.',
    required: false,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeBytes: 5 * 1024 * 1024,
    requiresUpload: true,
    requiresNumber: false,
    hasExpiry: false,
    adminVerificationRequired: true
  },
  {
    key: PrismaDocumentType.PASSPORT,
    name: 'International Passport',
    description: 'Your International Passport data page for identity verification.',
    required: false,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeBytes: 5 * 1024 * 1024,
    requiresUpload: true,
    requiresNumber: true,
    hasExpiry: true,
    adminVerificationRequired: true
  },
  {
    key: PrismaDocumentType.DRIVERS_LICENSE,
    name: 'Driver\'s License',
    description: 'Your Driver\'s License for identity verification.',
    required: false,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeBytes: 5 * 1024 * 1024,
    requiresUpload: true,
    requiresNumber: true,
    hasExpiry: true,
    adminVerificationRequired: true
  },
  {
    key: PrismaDocumentType.VOTERS_CARD,
    name: 'Voter\'s Card',
    description: 'Your Permanent Voter\'s Card (PVC) for identity verification.',
    required: false,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeBytes: 5 * 1024 * 1024,
    requiresUpload: true,
    requiresNumber: false,
    hasExpiry: false,
    adminVerificationRequired: true
  },
  {
    key: PrismaDocumentType.SELFIE,
    name: 'Identity Verification Selfie',
    description: 'A clear selfie of you holding your ID document to prove your identity.',
    required: true,
    acceptedFormats: ['jpg', 'jpeg', 'png'],
    maxSizeBytes: 3 * 1024 * 1024,
    requiresUpload: true,
    requiresNumber: false,
    hasExpiry: false,
    adminVerificationRequired: true
  },
  {
    key: PrismaDocumentType.OTHER,
    name: 'Other',
    description: 'For any other legal document not listed above.',
    required: false,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeBytes: 10 * 1024 * 1024,
    requiresUpload: true,
    requiresNumber: false,
    hasExpiry: false,
    adminVerificationRequired: true
  },
];

export default function UploadLegalDocumentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  const user = useAuthStore(state => state.user);
  const { fetchPropertyById, selectedProperty } = usePropertyStore();

  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | null>(null);
  const [documentNumber, setDocumentNumber] = useState('');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (propertyId) {
      fetchPropertyById(propertyId);
    }
  }, [propertyId, fetchPropertyById]);

  const handleDocumentTypeChange = (value: string) => {
    const docType = DOCUMENT_TYPES.find(d => d.key === value);
    if (docType) {
      setSelectedDocumentType(docType);
      // Reset form on type change
      setDocumentNumber('');
      setUploadedFile(null);
    }
  };

  const handleUploadComplete = (res: any) => {
    setIsUploading(false);
    if (res && res.length > 0) {
      const file = res[0];
      setUploadedFile({
        url: file.url,
        name: file.name,
        size: file.size,
        type: file.type,
      });
      toast.success('File uploaded successfully!');
    }
  };

  const handleUploadError = (error: any) => {
    setIsUploading(false);
    console.error('Upload Error:', error);
    toast.error('File upload failed. Please try again.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDocumentType) {
      toast.error('Please select a document type.');
      return;
    }

    if (selectedDocumentType.requiresNumber && !documentNumber) {
      toast.error('Please enter the document number.');
      return;
    }

    if (selectedDocumentType.requiresUpload && !uploadedFile) {
      toast.error('Please upload a file.');
      return;
    }

    const payload = {
      documentType: selectedDocumentType.key,
      propertyId: propertyId || undefined,
      documentNumber: selectedDocumentType.requiresNumber ? documentNumber : undefined,
      fileName: selectedDocumentType.requiresUpload ? uploadedFile?.name : undefined,
      fileUrl: selectedDocumentType.requiresUpload ? uploadedFile?.url : undefined,
      fileSizeBytes: selectedDocumentType.requiresUpload ? uploadedFile?.size : undefined,
      mimeType: selectedDocumentType.requiresUpload ? uploadedFile?.type : undefined,
    };

    try {
      const { data, error } = await api.post('/properties/legal/documents', payload);
      
      if (error) {
        throw new Error(error.message);
      }

      toast.success('Document submitted for verification!');
      router.push(`/dashboard/profile/verification`);

    } catch (err: any) {
      console.error('Submission error:', err);
      toast.error(err.message || 'Failed to submit document. Please try again.');
    }
  };

  const userCanUploadOwnership = user?.userType === 'LANDLORD' || user?.userType === 'AGENT' && selectedProperty?.ownerId === user?.id;
  const userCanUploadConsent = user?.userType === 'AGENT';

  const isNINOrBVNSelected = selectedDocumentType?.key === 'NIN' || selectedDocumentType?.key === 'BVN';
  const isUploadRequired = selectedDocumentType?.requiresUpload;
  const isNumberRequired = selectedDocumentType?.requiresNumber;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button onClick={() => router.back()} variant="ghost" size="icon" aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <CardTitle className="text-2xl font-bold">Upload Legal Documents</CardTitle>
              <CardDescription>
                Submit the necessary documents to verify your profile and properties.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {propertyId && selectedProperty && (
            <Alert variant="default" className="mb-6 bg-blue-50 border-blue-200">
              <Info className="h-4 w-4" />
              <AlertTitle>Uploading for Property</AlertTitle>
              <AlertDescription>
                You are uploading a document for the property: <strong>{selectedProperty.title}</strong>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="documentType" className="font-semibold">
                Document Type
              </Label>
              <Select onValueChange={handleDocumentTypeChange} value={selectedDocumentType?.key || ''}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a document type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.filter(doc => {
                    // Filter based on user type and context (property upload)
                    if (doc.key === PrismaDocumentType.OWNERSHIP_DOCUMENT) {
                      return userCanUploadOwnership;
                    }
                    if (doc.key === PrismaDocumentType.CONSENT_DOCUMENT) {
                      return userCanUploadConsent;
                    }
                    return true;
                  }).map(doc => (
                    <SelectItem key={doc.key} value={doc.key}>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-gray-500" />
                        {doc.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDocumentType && (
              <div className="space-y-4">
                <Alert className="bg-gray-50 border-gray-200">
                  <Info className="h-4 w-4" />
                  <AlertTitle>{selectedDocumentType.name}</AlertTitle>
                  <AlertDescription>
                    <p>{selectedDocumentType.description}</p>
                    <ul className="list-disc list-inside mt-2 text-sm text-gray-600">
                      {selectedDocumentType.instructions?.map((instruction, index) => (
                        <li key={index}>{instruction}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>

                {isNumberRequired && (
                  <div className="space-y-2">
                    <Label htmlFor="documentNumber" className="font-semibold">
                      Document Number
                    </Label>
                    <Input
                      id="documentNumber"
                      type="text"
                      placeholder={`Enter your ${selectedDocumentType.name} number`}
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      required
                    />
                  </div>
                )}

                {isUploadRequired && (
                  <div className="space-y-2">
                    <Label htmlFor="documentUpload" className="font-semibold">
                      Document File
                    </Label>
                    <UploadButton
                      endpoint="documentUploader"
                      onClientUploadComplete={handleUploadComplete}
                      onUploadError={handleUploadError}
                      onUploadBegin={() => {
                        setIsUploading(true);
                        setUploadProgress(0);
                      }}
                      onProgress={(p) => setUploadProgress(p)}
                      content={{
                        button({ ready }) {
                          if (ready) return <div className="flex items-center gap-2"><Upload className="h-4 w-4" /> Choose File</div>;
                          return 'Getting ready...';
                        },
                      }}
                      className="w-full ut-button:bg-green-600 ut-button:hover:bg-green-700 ut-button:ut-readying:bg-gray-400 ut-button:transition-colors"
                    />

                    {isUploading && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500">Uploading...</p>
                        <Progress value={uploadProgress} className="w-full" />
                      </div>
                    )}
                    
                    {uploadedFile && (
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md mt-4 bg-green-50">
                        <div className="flex items-center gap-3">
                          <span className="text-green-600">
                            {getFileIcon(uploadedFile.type, 'h-6 w-6')}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{uploadedFile.name}</span>
                            <span className="text-xs text-gray-500">
                              {(uploadedFile.size / 1024).toFixed(2)} KB
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUploadedFile(null)}
                          className="text-red-500 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!selectedDocumentType || isUploading || (isUploadRequired && !uploadedFile) || (isNumberRequired && !documentNumber)}
            >
              Submit for Verification
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}