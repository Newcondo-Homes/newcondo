import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/';
import { Button } from '@newcondo/ui/';
import { Badge } from '@newcondo/ui/';
import { Alert, AlertDescription } from '@newcondo/ui/';
import { 
  FileText, 
  Download, 
  RefreshCw, 
  Eye,
  Calendar,
  User,
  AlertTriangle
} from 'lucide-react';
import { DocumentStatus } from '@/types/enums';
import { formatDate } from '@/lib/utils/format';

interface VerificationDocumentsProps {
  documents: any[];
  onResubmit: (documentId: string) => void;
}

export function VerificationDocuments({ documents, onResubmit }: VerificationDocumentsProps) {
  const [resubmittingId, setResubmittingId] = useState<string | null>(null);

  const handleResubmit = async (documentId: string) => {
    setResubmittingId(documentId);
    try {
      await onResubmit(documentId);
    } finally {
      setResubmittingId(null);
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

  return (
    <div className="space-y-6">
      {documents?.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents uploaded</h3>
            <p className="text-gray-600 mb-4">
              Upload your first document to begin the verification process.
            </p>
            <Button>Upload Document</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((document) => (
            <Card key={document.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <div>
                      <CardTitle className="text-lg">
                        {formatDocumentType(document.documentType)}
                      </CardTitle>
                      {document.documentSide && (
                        <p className="text-sm text-gray-600">
                          {document.documentSide} Side
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={getStatusColor(document.status)}>
                    {document.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Document Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Uploaded:</span>
                      <span>{formatDate(document.createdAt)}</span>
                    </div>
                    
                    {document.documentNumber && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Document ID:</span>
                        <span className="font-mono">{document.documentNumber}</span>
                      </div>
                    )}
                    
                    {document.fileName && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">File:</span>
                        <span>{document.fileName}</span>
                      </div>
                    )}
                    
                    {document.expiresAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Expires:</span>
                        <span>{formatDate(document.expiresAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Verification Notes */}
                  {document.verificationNotes && (
                    <Alert variant={document.status === DocumentStatus.REJECTED ? 'destructive' : 'default'}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Admin Notes:</strong> {document.verificationNotes}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {document.fileUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </a>
                      </Button>
                    )}
                    
                    {document.fileUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={document.fileUrl} download>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </a>
                      </Button>
                    )}
                    
                    {document.status === DocumentStatus.REJECTED && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleResubmit(document.id)}
                        disabled={resubmittingId === document.id}
                      >
                        {resubmittingId === document.id ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Resubmit
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
