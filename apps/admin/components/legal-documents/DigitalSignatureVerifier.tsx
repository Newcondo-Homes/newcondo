'use client';

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@newcondo/ui/components/ui/card';
import { Button } from '@newcondo/ui/components/ui/button';
import { Badge } from '@newcondo/ui/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@newcondo/ui/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@newcondo/ui/components/ui/alert-dialog';
import { Textarea } from '@newcondo/ui/components/ui/textarea';
import { 
  ShieldCheck, 
  ShieldX, 
  FileSignature, 
  Calendar, 
  User, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Info
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DigitalSignature {
  id: string;
  documentId: string;
  signerId: string;
  signerName: string;
  signerEmail: string;
  signatureHash: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  certificateChain: string[];
  isValid: boolean;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'INVALID' | 'EXPIRED';
  verificationNotes?: string;
}

interface Document {
  id: string;
  fileName: string;
  documentType: string;
  userId: string;
  userName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  signatures: DigitalSignature[];
}

interface DigitalSignatureVerifierProps {
  document: Document;
  onVerificationUpdate: (documentId: string, signatureId: string, status: 'VERIFIED' | 'INVALID', notes?: string) => void;
}

export default function DigitalSignatureVerifier({ 
  document, 
  onVerificationUpdate 
}: DigitalSignatureVerifierProps) {
  const [selectedSignature, setSelectedSignature] = useState<DigitalSignature | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const getSignatureStatusIcon = (status: DigitalSignature['verificationStatus']) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'INVALID':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'EXPIRED':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const getSignatureStatusColor = (status: DigitalSignature['verificationStatus']) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'INVALID':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'EXPIRED':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      default:
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    }
  };

  const handleVerificationAction = async (signatureId: string, action: 'VERIFIED' | 'INVALID') => {
    setIsVerifying(true);
    try {
      await onVerificationUpdate(document.id, signatureId, action, verificationNotes);
      setSelectedSignature(null);
      setVerificationNotes('');
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const validateSignatureTechnically = (signature: DigitalSignature) => {
    // This would integrate with actual digital signature validation
    // For now, we simulate technical validation checks
    return {
      hashValid: signature.signatureHash.length > 0,
      certificateValid: signature.certificateChain.length > 0,
      timestampValid: signature.timestamp <= new Date(),
      ipValid: signature.ipAddress.length > 0
    };
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Digital Signature Verification
            </CardTitle>
            <CardDescription>
              {document.fileName} - {document.signatures.length} signature(s)
            </CardDescription>
          </div>
          <Badge variant={document.status === 'APPROVED' ? 'default' : 'secondary'}>
            {document.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {document.signatures.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileSignature className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No digital signatures found for this document</p>
          </div>
        ) : (
          <div className="space-y-3">
            {document.signatures.map((signature) => {
              const technicalValidation = validateSignatureTechnically(signature);
              const allChecksPass = Object.values(technicalValidation).every(Boolean);
              
              return (
                <Card key={signature.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getSignatureStatusIcon(signature.verificationStatus)}
                          <span className="font-medium">{signature.signerName}</span>
                        </div>
                        <Badge className={getSignatureStatusColor(signature.verificationStatus)}>
                          {signature.verificationStatus}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedSignature(signature)}
                            >
                              <Info className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Signature Details</DialogTitle>
                              <DialogDescription>
                                Technical details and verification information
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              {/* Signer Information */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Signer Name</label>
                                  <p className="mt-1">{signature.signerName}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Email</label>
                                  <p className="mt-1">{signature.signerEmail}</p>
                                </div>
                              </div>
                              
                              {/* Technical Details */}
                              <div className="space-y-3">
                                <h4 className="font-medium">Technical Validation</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    {technicalValidation.hashValid ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-red-600" />
                                    )}
                                    <span>Signature Hash</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {technicalValidation.certificateValid ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-red-600" />
                                    )}
                                    <span>Certificate Chain</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {technicalValidation.timestampValid ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-red-600" />
                                    )}
                                    <span>Timestamp</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {technicalValidation.ipValid ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-red-600" />
                                    )}
                                    <span>IP Address</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Metadata */}
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <label className="text-sm font-medium text-gray-600">IP Address</label>
                                  <p className="mt-1 font-mono">{signature.ipAddress}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Signed At</label>
                                  <p className="mt-1">{signature.timestamp.toLocaleString()}</p>
                                </div>
                              </div>
                              
                              {signature.verificationNotes && (
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Verification Notes</label>
                                  <p className="mt-1 p-2 bg-gray-50 rounded text-sm">
                                    {signature.verificationNotes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        {signature.verificationStatus === 'PENDING' && (
                          <div className="flex gap-1">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  disabled={!allChecksPass}
                                  onClick={() => setSelectedSignature(signature)}
                                >
                                  <ShieldCheck className="h-4 w-4 mr-1" />
                                  Verify
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Verify Digital Signature</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Confirm that this digital signature is valid and authentic.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                
                                <div className="space-y-3">
                                  <Textarea
                                    placeholder="Add verification notes (optional)"
                                    value={verificationNotes}
                                    onChange={(e) => setVerificationNotes(e.target.value)}
                                  />
                                </div>
                                
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleVerificationAction(signature.id, 'VERIFIED')}
                                    disabled={isVerifying}
                                  >
                                    Verify as Valid
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => setSelectedSignature(signature)}
                                >
                                  <ShieldX className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reject Digital Signature</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Mark this digital signature as invalid. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                
                                <div className="space-y-3">
                                  <Textarea
                                    placeholder="Reason for rejection (required)"
                                    value={verificationNotes}
                                    onChange={(e) => setVerificationNotes(e.target.value)}
                                    required
                                  />
                                </div>
                                
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleVerificationAction(signature.id, 'INVALID')}
                                    disabled={isVerifying || !verificationNotes.trim()}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Mark as Invalid
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{signature.signerEmail}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDistanceToNow(signature.timestamp, { addSuffix: true })}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}