'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';

interface VerificationHistoryItem {
  id: string;
  action: 'APPROVED' | 'REJECTED' | 'SUBMITTED';
  timestamp: string;
  adminName?: string;
  adminId?: string;
  reason?: string;
  metadata?: {
    documentsReviewed?: number;
    reviewDuration?: number;
  };
}

interface VerificationHistoryProps {
  userId: string;
  history: VerificationHistoryItem[];
  userName?: string;
}

export function VerificationHistory({
  userId,
  history,
  userName,
}: VerificationHistoryProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'SUBMITTED':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'APPROVED':
        return 'Verification Approved';
      case 'REJECTED':
        return 'Verification Rejected';
      case 'SUBMITTED':
        return 'Documents Submitted';
      default:
        return action;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'SUBMITTED':
        return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verification History</CardTitle>
          <CardDescription>No verification activity recorded yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="mb-4 h-12 w-12 text-gray-400" />
            <p className="text-sm text-gray-500">
              This user has not submitted any verification documents yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification History</CardTitle>
        <CardDescription>
          Complete timeline of verification activities for {userName || 'this user'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6">
          {/* Timeline Line */}
          <div className="absolute left-[21px] top-2 h-[calc(100%-24px)] w-0.5 bg-gray-200" />

          {history.map((item, index) => (
            <div key={item.id} className="relative flex gap-4">
              {/* Timeline Dot */}
              <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-4 border-white bg-gray-50">
                {getActionIcon(item.action)}
              </div>

              {/* Content */}
              <div className="flex-1 pb-8">
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-gray-900">
                        {getActionText(item.action)}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {format(new Date(item.timestamp), 'PPpp')}
                      </p>
                    </div>
                    {getActionBadge(item.action)}
                  </div>

                  {item.adminName && (
                    <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
                      <UserIcon className="h-4 w-4" />
                      <span>
                        Reviewed by <span className="font-medium">{item.adminName}</span>
                      </span>
                    </div>
                  )}

                  {item.reason && (
                    <div className="mt-3 rounded-md bg-gray-50 p-3">
                      <p className="text-sm font-medium text-gray-700">Reason:</p>
                      <p className="mt-1 text-sm text-gray-600">{item.reason}</p>
                    </div>
                  )}

                  {item.metadata && (
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                      {item.metadata.documentsReviewed && (
                        <span>
                          Documents reviewed: <strong>{item.metadata.documentsReviewed}</strong>
                        </span>
                      )}
                      {item.metadata.reviewDuration && (
                        <span>
                          Review time: <strong>{item.metadata.reviewDuration}m</strong>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}