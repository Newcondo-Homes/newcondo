import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/';
import { Badge } from '@newcondo/ui/';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Upload,
  Calendar
} from 'lucide-react';
import { DocumentStatus } from '@/types/enums';
import { formatDate } from '@/lib/utils/format';

// ✅ Typed interface replacing any[]
interface VerificationDocument {
  id: string;
  documentType: string;
  documentSide?: string;
  status: DocumentStatus;
  createdAt: string;
}

interface VerificationHistoryProps {
  documents: VerificationDocument[];
}

export function VerificationHistory({ documents }: VerificationHistoryProps) {
  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.APPROVED:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case DocumentStatus.REJECTED:
        return <XCircle className="h-4 w-4 text-red-500" />;
      case DocumentStatus.PENDING:
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Upload className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.APPROVED:
        return 'default';
      case DocumentStatus.REJECTED:
        return 'destructive';
      case DocumentStatus.PENDING:
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatDocumentType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const sortedDocuments = [...(documents || [])].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification History</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedDocuments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No verification history</h3>
            <p className="text-gray-600">
              Your verification activities will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDocuments.map((document) => (
              <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(document.status)}
                  <div>
                    <h4 className="font-medium">
                      {formatDocumentType(document.documentType)}
                      {document.documentSide && ` (${document.documentSide})`}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {formatDate(document.createdAt)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(document.status)}>
                    {document.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}