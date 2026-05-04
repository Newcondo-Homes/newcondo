// apps/platform/components/marking/OwnerConfirmationPrompt.tsx
'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Textarea } from '@newcondo/ui/components/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@newcondo/ui/components/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@newcondo/ui/components/alert-dialog';
import Image from 'next/image';

interface OwnerConfirmationPromptProps {
  jobId: string;
  propertyTitle: string;
  agentName: string;
  agentPhoto?: string;
  completionImages: string[];
  markingNotes?: string;
  deadline: Date;
  onConfirm: (jobId: string, notes?: string) => Promise<void>;
  onReject: (jobId: string, reason: string) => Promise<void>;
  isLoading?: boolean;
}

export const OwnerConfirmationPrompt: React.FC<OwnerConfirmationPromptProps> = ({
  jobId,
  propertyTitle,
  agentName,
  agentPhoto,
  completionImages,
  markingNotes,
  deadline,
  onConfirm,
  onReject,
  isLoading = false,
}) => {
  const [showImages, setShowImages] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  const handleConfirm = async () => {
    setConfirmLoading(true);
    try {
      await onConfirm(jobId);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    setRejectLoading(true);
    try {
      await onReject(jobId, rejectReason);
      setShowRejectDialog(false);
      setRejectReason('');
    } finally {
      setRejectLoading(false);
    }
  };

  const isOverdue = new Date() > deadline;

  return (
    <Card className="border-2 border-orange-200 bg-orange-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <div>
              <CardTitle>Action Required</CardTitle>
              <CardDescription>Please confirm the property marking</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Agent Information */}
        <div className="p-4 bg-white rounded-lg border border-orange-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Marking Completed By</h3>
          <div className="flex items-center gap-3">
            {agentPhoto ? (
              <Image
                src={agentPhoto}
                alt={agentName}
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-xs font-semibold text-gray-600">
                  {agentName.split(' ').map((n) => n[0]).join('')}
                </span>
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{agentName}</p>
              <p className="text-xs text-gray-500">Professional Agent</p>
            </div>
          </div>
        </div>

        {/* Property Title */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Property</h4>
          <p className="text-gray-900">{propertyTitle}</p>
        </div>

        {/* Completion Images */}
        {completionImages && completionImages.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Marking Photos</h4>
            <div className="space-y-2">
              {/* Image Preview Grid */}
              <div className="grid grid-cols-3 gap-2">
                {completionImages.slice(0, 3).map((image, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-lg bg-gray-100 overflow-hidden border border-gray-200"
                  >
                    <Image
                      src={image}
                      alt={`Marking photo ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>

              {/* View All Images Button */}
              {completionImages.length > 3 && (
                <Dialog open={showImages} onOpenChange={setShowImages}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      View All {completionImages.length} Photos
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Marking Photos</DialogTitle>
                      <DialogDescription>
                        Review all photos from the marking process
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
                      {completionImages.map((image, idx) => (
                        <div
                          key={idx}
                          className="relative rounded-lg overflow-hidden border border-gray-200"
                        >
                          <Image
                            src={image}
                            alt={`Marking photo ${idx + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        )}

        {/* Marking Notes */}
        {markingNotes && (
          <details className="group">
            <summary className="cursor-pointer flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900">
              <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
              Agent Notes
            </summary>
            <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{markingNotes}</p>
            </div>
          </details>
        )}

        {/* Deadline Warning */}
        {isOverdue && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">Confirmation Overdue</p>
                <p className="text-xs text-red-700 mt-1">
                  The agent will receive compensation for this marking if you don&apos;t confirm soon.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Instructions */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-900">
            <span className="font-semibold">Please review carefully:</span> Confirm only if the photos clearly show your property boundary is correctly marked on the map. This is how your property will be identified on the Newcondo platform.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={handleConfirm}
            disabled={isLoading || confirmLoading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {confirmLoading ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Marking
              </>
            )}
          </Button>

          <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50">
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reject This Marking</AlertDialogTitle>
                <AlertDialogDescription>
                  Please tell us why this marking is not acceptable. This helps us maintain quality.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Textarea
                placeholder="Reason for rejection (e.g., wrong boundary, incomplete, quality issues...)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-24"
              />
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  Note: You will need to initiate a new marking job and pay the marking fee again.
                </p>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReject}
                  disabled={rejectLoading || !rejectReason.trim()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {rejectLoading ? 'Rejecting...' : 'Reject Marking'}
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Job ID Reference */}
        <div className="text-xs text-gray-500 text-center pt-2">
          Job ID: {jobId}
        </div>
      </CardContent>
    </Card>
  );
};