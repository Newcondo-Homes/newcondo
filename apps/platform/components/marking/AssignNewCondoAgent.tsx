import React, { useState } from 'react';
import { Button } from '@newcondo/ui';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface AssignNewCondoAgentProps {
  propertyId: string;
  onAssign: (data: AssignmentData) => Promise<void>;
  isLoading?: boolean;
}

interface AssignmentData {
  assignmentType: 'newcondo' | 'agent_network';
  fee: number;
  paymentMethod: string;
}

export const AssignNewCondoAgent: React.FC<AssignNewCondoAgentProps> = ({
  onAssign,
  isLoading = false,
}) => {
  const [selectedOption, setSelectedOption] = useState<'newcondo' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const NEWCONDO_FEE = 25000; // Naira for Newcondo to mark the property

  const handleAssignToNewcondo = async () => {
    try {
      setIsProcessing(true);
      await onAssign({
        assignmentType: 'newcondo',
        fee: NEWCONDO_FEE,
        paymentMethod: 'bank_transfer',
      });
      setSelectedOption('newcondo');
    } catch (error) {
      console.error('Failed to assign to Newcondo:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Assign to Newcondo Agent
        </h3>

        {/* Information Section */}
        <div className="mb-6 space-y-3 rounded-lg bg-blue-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Professional Marking Service
              </p>
              <p className="text-sm text-blue-800">
                Newcondo will handle all property marking using our trained agents.
              </p>
            </div>
          </div>
        </div>

        {/* Newcondo Option */}
        <div className="space-y-4">
          <div
            className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
              selectedOption === 'newcondo'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => setSelectedOption('newcondo')}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">
                  Newcondo Professional Marking
                </h4>
                <p className="mt-1 text-sm text-gray-600">
                  Our trained agents will mark your property at the agreed time
                </p>

                {/* Details */}
                <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Marking Fee:</span>
                    <span className="font-semibold text-gray-900">
                      ₦{NEWCONDO_FEE.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Timeline:</span>
                    <span className="font-semibold text-gray-900">
                      2-3 days
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Includes:</span>
                    <span className="font-semibold text-gray-900">
                      Boundary marking + Photos
                    </span>
                  </div>
                </div>
              </div>
              {selectedOption === 'newcondo' && (
                <CheckCircle2 className="h-6 w-6 text-blue-500" />
              )}
            </div>
          </div>

          {/* Timeline Info */}
          <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-4">
            <Clock className="h-5 w-5 flex-shrink-0 text-amber-600" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Confirmation Required</p>
              <p className="mt-1">
                Once marked, you&apos;ll have 2-3 days to confirm and verify the marking.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <Button
            onClick={handleAssignToNewcondo}
            disabled={selectedOption !== 'newcondo' || isLoading || isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? 'Processing...' : 'Continue with Newcondo'}
          </Button>

          <p className="text-xs text-gray-500">
            You&apos;ll proceed to payment after confirming this selection
          </p>
        </div>
      </div>
    </div>
  );
};