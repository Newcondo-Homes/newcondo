'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  CheckCircle,
  Eye,
  User,
  Camera,
  XCircle,
  Info,
} from 'lucide-react';
import Image from 'next/image';

interface SelfieVerificationProps {
  selfieUrl: string;
  userName: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  onApprove?: () => void;
  onReject?: (reason: string) => void;
}

export function SelfieVerification({
  selfieUrl,
  userName,
  submittedAt,
  status,
  onApprove,
  onReject,
}: SelfieVerificationProps) {
  const [selectedChecks, setSelectedChecks] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'normal' | 'enhanced'>('normal');
  const [rejectionReason, setRejectionReason] = useState('');

  const verificationChecks = [
    {
      id: 'live-person',
      label: 'Live person visible',
      description: 'Photo shows a real person, not a photo/screen',
      critical: true,
    },
    {
      id: 'face-clear',
      label: 'Face is clear and visible',
      description: 'All facial features are clearly visible',
      critical: true,
    },
    {
      id: 'no-obstruction',
      label: 'No obstructions',
      description: 'Face not covered by glasses, mask, or accessories',
      critical: false,
    },
    {
      id: 'good-lighting',
      label: 'Good lighting',
      description: 'Image is well-lit without heavy shadows',
      critical: false,
    },
    {
      id: 'no-blur',
      label: 'Image not blurry',
      description: 'Photo is sharp and in focus',
      critical: true,
    },
    {
      id: 'centered',
      label: 'Face is centered',
      description: 'Face occupies most of the frame',
      critical: false,
    },
  ];

  const commonRejectionReasons = [
    'Photo is too blurry or out of focus',
    'Photo appears to be a screenshot or photo of another photo',
    'Face is not clearly visible or partially obscured',
    'Poor lighting makes verification difficult',
    'Photo quality is too low',
    'Face does not match ID document',
  ];

  const handleCheckToggle = (checkId: string) => {
    const newChecks = new Set(selectedChecks);
    if (newChecks.has(checkId)) {
      newChecks.delete(checkId);
    } else {
      newChecks.add(checkId);
    }
    setSelectedChecks(newChecks);
  };

  const criticalChecks = verificationChecks.filter((c) => c.critical);
  const allCriticalChecked = criticalChecks.every((check) => selectedChecks.has(check.id));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Selfie Verification</CardTitle>
              <CardDescription>
                Verify the selfie photo submitted by {userName}
              </CardDescription>
            </div>
            {status === 'approved' && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="mr-1 h-3 w-3" />
                Approved
              </Badge>
            )}
            {status === 'rejected' && (
              <Badge className="bg-red-100 text-red-800">
                <XCircle className="mr-1 h-3 w-3" />
                Rejected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Selfie Photo</h3>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'normal' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('normal')}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Normal
                </Button>
                <Button
                  variant={viewMode === 'enhanced' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('enhanced')}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Enhanced
                </Button>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-lg border bg-gray-50">
              <div className="flex items-center justify-center p-8">
                <div className="relative">
                  <Image
                    src={selfieUrl}
                    alt={`Selfie of ${userName}`}
                    width={400}
                    height={400}
                    className={`max-h-[500px] w-auto rounded-lg object-contain ${
                      viewMode === 'enhanced' ? 'contrast-125 brightness-110' : ''
                    }`}
                  />
                  {/* Face Detection Overlay (mockup) */}
                  {viewMode === 'enhanced' && (
                    <div className="absolute left-1/2 top-1/2 h-64 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-500 border-dashed opacity-50" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Submitted: {new Date(submittedAt).toLocaleString()}</span>
              <Button variant="ghost" size="sm" asChild>
                <a href={selfieUrl} target="_blank" rel="noopener noreferrer">
                  View Full Size
                </a>
              </Button>
            </div>
          </div>

          {/* Verification Checklist */}
          {status === 'pending' && (
            <>
              <div className="space-y-3">
                <h3 className="font-semibold">Verification Checklist</h3>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    All critical items must be checked before approval. Non-critical items are
                    optional but recommended.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  {verificationChecks.map((check) => (
                    <label
                      key={check.id}
                      className="flex items-start gap-3 rounded-lg border p-3 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selectedChecks.has(check.id)}
                        onChange={() => handleCheckToggle(check.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{check.label}</p>
                          {check.critical && (
                            <Badge variant="outline" className="text-xs">
                              Critical
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{check.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {!allCriticalChecked && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      All critical verification checks must be completed before approving.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 border-t pt-4">
                <Button
                  onClick={onApprove}
                  disabled={!allCriticalChecked}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve Selfie
                </Button>
                <Button
                  onClick={() => {
                    const reason = prompt(
                      'Please provide a reason for rejection:\n\nCommon reasons:\n' +
                        commonRejectionReasons.map((r, i) => `${i + 1}. ${r}`).join('\n')
                    );
                    if (reason) {
                      onReject?.(reason);
                    }
                  }}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Selfie
                </Button>
              </div>
            </>
          )}

          {/* Quality Indicators */}
          <div className="rounded-lg border bg-gray-50 p-4">
            <h3 className="mb-3 font-semibold">Quality Indicators</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm">High Resolution</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="text-sm">Moderate Lighting</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm">Face Detected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm">No Digital Manipulation</span>
              </div>
            </div>
          </div>

          {/* Common Rejection Reasons Reference */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 font-semibold">Common Rejection Reasons</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              {commonRejectionReasons.map((reason, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}