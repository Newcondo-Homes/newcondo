import { Alert, AlertDescription } from '@newcondo/ui/';
import { Badge } from '@newcondo/ui/';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Shield
} from 'lucide-react';
import { formatDate } from '@/lib/utils/format';

interface VerificationStatusProps {
  status: string;
  verifiedAt?: Date | null;
  rejectionReason?: string | null;
}

export function VerificationStatus({ status, verifiedAt, rejectionReason }: VerificationStatusProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case 'VERIFIED':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          title: 'Verified',
          description: 'Your identity has been successfully verified.',
          variant: 'default' as const,
          bgColor: 'bg-green-50 border-green-200'
        };
      case 'REJECTED':
        return {
          icon: <XCircle className="h-5 w-5 text-red-500" />,
          title: 'Verification Rejected',
          description: 'Your verification was rejected. Please review and resubmit.',
          variant: 'destructive' as const,
          bgColor: 'bg-red-50 border-red-200'
        };
      case 'PENDING':
      default:
        return {
          icon: <Clock className="h-5 w-5 text-yellow-500" />,
          title: 'Verification Pending',
          description: 'Your documents are being reviewed. This usually takes 1-3 business days.',
          variant: 'default' as const,
          bgColor: 'bg-yellow-50 border-yellow-200'
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="space-y-4">
      <Alert variant={statusDisplay.variant} className={statusDisplay.bgColor}>
        <div className="flex items-center gap-3">
          {statusDisplay.icon}
          <div>
            <h3 className="font-medium">{statusDisplay.title}</h3>
            <AlertDescription className="mt-1">
              {statusDisplay.description}
            </AlertDescription>
          </div>
        </div>
      </Alert>

      {verifiedAt && status === 'VERIFIED' && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Shield className="h-4 w-4" />
          <span>Verified on {formatDate(verifiedAt)}</span>
        </div>
      )}

      {rejectionReason && status === 'REJECTED' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Rejection Reason:</strong> {rejectionReason}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
