import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/';
import VerificationUploader from '@/components/profile/VerificationUploader';
import { Badge } from '@newcondo/ui/';
import { 
  FileText, 
  Camera, 
  User, 
  Building,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { DocumentType, DocumentStatus } from '@/types/enums';

// ✅ Typed interface replacing any[]
interface VerificationDocument {
  id: string;
  documentType: DocumentType;
  status: DocumentStatus;
}

interface VerificationOverviewProps {
  documents: VerificationDocument[];
  stats: {
    total: number;
    completed: number;
    pending: number;
    rejected: number;
  };
  overallStatus: string;
}

export function VerificationOverview({ documents, stats }: VerificationOverviewProps) {
  const requiredDocuments = [
    {
      type: DocumentType.NIN,
      name: 'National ID (NIN)',
      description: 'Your National Identification Number',
      icon: User,
      category: 'Identity'
    },
    {
      type: DocumentType.SELFIE,
      name: 'Selfie Photo',
      description: 'A clear photo of yourself',
      icon: Camera,
      category: 'Identity'
    },
    {
      type: DocumentType.PASSPORT,
      name: 'Passport (Optional)',
      description: 'International passport for additional verification',
      icon: FileText,
      category: 'Identity'
    },
    {
      type: DocumentType.UTILITY_BILL,
      name: 'Utility Bill',
      description: 'Recent utility bill for address verification',
      icon: Building,
      category: 'Address'
    }
  ];

  const getDocumentStatus = (docType: DocumentType): DocumentStatus | null => {
    const doc = documents?.find(d => d.documentType === docType);
    return doc?.status || null;
  };

  const getStatusIcon = (status: DocumentStatus | null) => {
    switch (status) {
      case DocumentStatus.APPROVED:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case DocumentStatus.REJECTED:
        return <XCircle className="h-4 w-4 text-red-500" />;
      case DocumentStatus.PENDING:
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: DocumentStatus | null) => {
    switch (status) {
      case DocumentStatus.APPROVED:
        return <Badge variant="default">Approved</Badge>;
      case DocumentStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>;
      case DocumentStatus.PENDING:
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">Not Uploaded</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Required Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Required Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requiredDocuments.map((doc) => {
              const status = getDocumentStatus(doc.type);
              const Icon = doc.icon;

              return (
                <div key={doc.type} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-gray-500" />
                    <div>
                      <h4 className="font-medium">{doc.name}</h4>
                      <p className="text-sm text-gray-600">{doc.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    {getStatusBadge(status)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upload New Document */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <VerificationUploader />
        </CardContent>
      </Card>
    </div>
  );
}