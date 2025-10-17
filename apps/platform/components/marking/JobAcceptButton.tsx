// apps/platform/components/marking/JobAcceptButton.tsx
'use client';

import { useState } from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';

interface JobAcceptButtonProps {
  jobId: string;
  markingFee: number;
  agentCompensation: number;
  onAccept: (jobId: string) => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  isAccepted?: boolean;
  isExpired?: boolean;
  compact?: boolean;
}

export function JobAcceptButton({
  jobId,
  markingFee,
  agentCompensation,
  onAccept,
  onSuccess,
  onError,
  disabled = false,
  isAccepted = false,
  isExpired = false,
  compact = false,
}: JobAcceptButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAccepted, setHasAccepted] = useState(isAccepted);

  const handleAccept = async () => {
    if (hasAccepted || isExpired || disabled || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await onAccept(jobId);
      setHasAccepted(true);
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept job';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (hasAccepted) {
    if (compact) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-lg">
          <Check className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">Job Accepted</span>
        </div>
      );
    }

    return (
      <div className="w-full p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <Check className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-green-900">Job Accepted!</h3>
        </div>
        <p className="text-sm text-green-700">
          You have 3 hours to complete the property marking. You'll receive a preliminary payment of ₦1,000 upon completion.
        </p>
      </div>
    );
  }

  if (isExpired) {
    if (compact) {
      return (
        <button disabled className="px-3 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed">
          Slot Expired
        </button>
      );
    }

    return (
      <button disabled className="w-full px-4 py-3 bg-gray-100 text-gray-500 rounded-lg font-medium cursor-not-allowed">
        Time Slot Expired
      </button>
    );
  }

  if (compact) {
    return (
      <button
        onClick={handleAccept}
        disabled={disabled || isLoading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-all ${
          disabled || isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Accepting...
          </>
        ) : (
          <>
            <Check className="w-4 h-4" />
            Accept Job
          </>
        )}
      </button>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Job Details</h3>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-blue-700">Total Marking Fee</span>
            <span className="font-semibold text-blue-900">₦{markingFee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-blue-700">Your Compensation (Initial)</span>
            <span className="font-semibold text-green-600">₦1,000</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-blue-700">Final Payment (Upon Confirmation)</span>
            <span className="font-semibold text-green-600">₦{(agentCompensation - 1000).toLocaleString()}</span>
          </div>
        </div>

        <p className="text-xs text-blue-600 mb-4">
          ✓ You'll have 3 hours to complete the marking
          <br />✓ Property owner must confirm within 3 days
          <br />✓ Full payment released upon confirmation
        </p>

        <button
          onClick={handleAccept}
          disabled={disabled || isLoading}
          className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            disabled || isLoading
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Accepting Job...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Accept This Job
            </>
          )}
        </button>
      </div>
    </div>
  );
}