'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Download,
  Eye,
  FileText,
  User,
  Mail,
  Phone,
  Calendar,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

type Document = {
  id: string;
  documentType: string;
  documentSide: string | null;
  documentNumber: string | null;
  fileName: string | null;
  fileUrl: string | null;
  status: string;
  verificationNotes: string | null;
  createdAt: string;
};

type VerificationDetail = {
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    role: string;
    verificationStatus: string;
    createdAt: string;
  };
  documents: Document[];
};

export default function VerificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = params.id as string;

  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);

  // Fetch verification details
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-verification', userId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/verifications/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch verification details');
      return response.json() as Promise<VerificationDetail>;
    },
  });

  // Approve verification mutation
  const approveVerificationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/verifications/${userId}/approve`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to approve verification');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verification', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
      toast.success('User verification approved successfully');
      router.push('/verifications');
    },
    onError: () => {
      toast.error('Failed to approve verification');
    },
  });

  // Reject verification mutation
  const rejectVerificationMutation = useMutation({
    mutationFn: async (reason: string) => {
      const response = await fetch(`/api/admin/verifications/${userId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to reject verification');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verification', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
      toast.success('Verification rejected');
      setShowRejectDialog(false);
      router.push('/verifications');
    },
    onError: () => {
      toast.error('Failed to reject verification');
    },
  });

  const handleApprove = () => {
    approveVerificationMutation.mutate();
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    rejectVerificationMutation.mutate(rejectionReason);
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      NIN: 'National ID Number',
      BVN: 'Bank Verification Number',
      PASSPORT: 'International Passport',
      VOTERS_CARD: "Voter's Card",
      DRIVERS_LICENSE: "Driver's License",
      SELFIE: 'Selfie Verification',
      OWNERSHIP_DOCUMENT: 'Property Ownership Document',
      CONSENT_DOCUMENT: 'Consent Document',
      UNDERTAKING_DOCUMENT: 'Undertaking Document',
      BUSINESS_REGISTRATION: 'Business Registration',
      TAX_CERTIFICATE: 'Tax Certificate',
      UTILITY_BILL: 'Utility Bill',
      BANK_STATEMENT: 'Bank Statement',
      OTHER: 'Other Document',
    };
    return labels[type] || type;
  };

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const isImageFile = (fileName: string | null) => {
    if (!fileName) return false;
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
  };

  if (isLoading) {
    return <VerificationDetailSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Failed to load verification details</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user, documents } = data;
  const isPending = user.verificationStatus === 'PENDING';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Verifications
        </Button>
        {isPending && (
          <div className="flex gap-2">
            <Button
              onClick={handleApprove}
              disabled={approveVerificationMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveVerificationMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve All
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowRejectDialog(true)}
              variant="destructive"
              disabled={rejectVerificationMutation.isPending}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </div>
        )}
      </div>

      {/* User Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-semibold">
                {user.name?.[0] || user.email[0].toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-2xl">{user.name || 'No name'}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{user.role}</Badge>
                  <Badge
                    className={
                      user.verificationStatus === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : user.verificationStatus === 'VERIFIED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }
                  >
                    {user.verificationStatus}
                  </Badge>
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{user.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Submitted Documents</CardTitle>
          <CardDescription>Review all documents submitted by the user</CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3" />
              <p>No documents submitted yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <h4 className="font-medium">{getDocumentTypeLabel(doc.documentType)}</h4>
                        {doc.documentSide && (
                          <Badge variant="outline" className="text-xs">
                            {doc.documentSide}
                          </Badge>
                        )}
                        {getDocumentStatusBadge(doc.status)}
                      </div>

                      {doc.documentNumber && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Document Number: <span className="font-mono">{doc.documentNumber}</span>
                        </p>
                      )}

                      {doc.fileName && (
                        <p className="text-sm text-muted-foreground mb-2">
                          File: {doc.fileName}
                        </p>
                      )}

                      {doc.verificationNotes && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                          <p className="text-yellow-800">{doc.verificationNotes}</p>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground mt-2">
                        Submitted on {new Date(doc.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {doc.fileUrl && (
                      <div className="flex gap-2">
                        {isImageFile(doc.fileName) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDocument(doc);
                              setShowImageViewer(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(doc.fileUrl!, '_blank')}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Verification</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a detailed reason for rejecting this verification request.
              The user will receive this feedback.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Rejection Reason</Label>
            <Textarea
              id="reason"
              placeholder="E.g., Documents are not clear, ID has expired, Information does not match..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700"
              disabled={rejectVerificationMutation.isPending || !rejectionReason.trim()}
            >
              {rejectVerificationMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject Verification'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Viewer Dialog */}
      <Dialog open={showImageViewer} onOpenChange={setShowImageViewer}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedDocument && getDocumentTypeLabel(selectedDocument.documentType)}
            </DialogTitle>
          </DialogHeader>
          {selectedDocument?.fileUrl && (
            <div className="relative w-full h-[600px]">
              <Image
                src={selectedDocument.fileUrl}
                alt={selectedDocument.fileName || 'Document'}
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VerificationDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}