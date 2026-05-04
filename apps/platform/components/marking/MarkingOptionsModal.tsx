/**
 * File: apps/platform/components/marking/MarkingOptionsModal.tsx
 * 
 * Component for displaying marking method options to property owners/agents
 * Allows users to choose between:
 * - Mark the property themselves
 * - Assign to Newcondo agent (25,000 NGN)
 * - Send someone they know with shareable link (20,000 NGN)
 * - Assign to nearby agents/renters (20,000 NGN)
 */

'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@newcondo/ui/components/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, MapPin, Users, Share2, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';

interface MarkingOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  fee?: string;
  estimatedTime: string;
  isAvailable: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

interface MarkingOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId?: string;
  onSelectOption: (optionId: string) => void;
  userRole: 'OWNER' | 'AGENT' | 'RENTER';
  isPremium?: boolean;
  hasPropertyImages?: boolean;
}

export const MarkingOptionsModal: React.FC<MarkingOptionsModalProps> = ({
  isOpen,
  onClose,
  propertyId: _propertyId,
  onSelectOption,
  userRole,
  isPremium = false,
  hasPropertyImages = false,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Define available options based on user role
  const getAvailableOptions = (): MarkingOption[] => {
    const options: MarkingOption[] = [
      {
        id: 'self-mark',
        title: 'Mark Property Myself',
        description: 'Mark your property boundary yourself using the map interface. Navigate to your property and draw the boundary on the satellite view.',
        icon: <MapPin className="w-6 h-6" />,
        estimatedTime: '15-30 minutes',
        isAvailable: true,
      },
      {
        id: 'newcondo-agent',
        title: 'Assign to Newcondo Agent',
        description: 'Newcondo will assign a verified agent to visit your property and mark the boundary professionally. Includes photo documentation.',
        icon: <Zap className="w-6 h-6" />,
        fee: '₦25,000',
        estimatedTime: '1-2 days',
        isAvailable: userRole === 'OWNER' || (userRole === 'AGENT' && isPremium),
      },
      {
        id: 'send-someone-known',
        title: 'Send Someone You Know',
        description: 'Generate a shareable link to send to someone you trust. They can mark the property on your behalf with your property details and access instructions.',
        icon: <Share2 className="w-6 h-6" />,
        fee: '₦20,000',
        estimatedTime: '2-3 days',
        isAvailable: userRole === 'OWNER',
      },
      {
        id: 'assign-nearby-agents',
        title: 'Assign to Nearby Agents',
        description: 'Newcondo broadcasts the marking job to available agents and premium renters nearby. First agent to complete within 3-hour window gets the job.',
        icon: <Users className="w-6 h-6" />,
        fee: '₦20,000',
        estimatedTime: '4-24 hours',
        isAvailable: userRole === 'OWNER',
      },
    ];

    return options;
  };

  const options = getAvailableOptions();

  const handleSelectOption = async (optionId: string) => {
    setSelectedOption(optionId);
    setIsLoading(true);

    try {
      // Validate before proceeding
      if (optionId === 'self-mark') {
        // Self-marking doesn't require additional validation
        onSelectOption(optionId);
      } else if (optionId === 'send-someone-known') {
        // Check if property has at least basic info
        if (!hasPropertyImages) {
          console.warn('Property images not provided - user should be warned');
        }
        onSelectOption(optionId);
      } else {
        // For paid options, require address and contact details
        onSelectOption(optionId);
      }

      onClose();
    } catch (error) {
      console.error('Error selecting marking option:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const unavailableMessage = {
    RENTER: 'Renters can only mark properties if they have a premium subscription.',
    AGENT: 'Agents can only assign to Newcondo or nearby agents with a premium subscription.',
    OWNER: 'Some options are not available for your account type.',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>How Would You Like to Mark Your Property?</DialogTitle>
          <DialogDescription>
            Choose a marking method that works best for you. Each method has different timelines and fees.
          </DialogDescription>
        </DialogHeader>

        {/* Info Alert */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            Property marking is required to verify geolocation and prevent duplicates. Choose the option that best fits your needs.
          </AlertDescription>
        </Alert>

        {/* Marking Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6">
          {options.map((option) => (
            <div
              key={option.id}
              className={`relative rounded-lg border-2 transition-all cursor-pointer ${
                selectedOption === option.id
                  ? 'border-blue-500 bg-blue-50'
                  : option.isAvailable
                    ? 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
              }`}
              onClick={() => option.isAvailable && handleSelectOption(option.id)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`${option.isAvailable ? 'text-gray-700' : 'text-gray-400'}`}>
                    {option.icon}
                  </div>
                  {option.fee && (
                    <span className="text-lg font-bold text-green-600">{option.fee}</span>
                  )}
                </div>

                <h3 className="font-semibold text-lg mb-2 text-gray-900">{option.title}</h3>

                <p className="text-sm text-gray-600 mb-4">{option.description}</p>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    ⏱ {option.estimatedTime}
                  </span>
                  {selectedOption === option.id && (
                    <span className="text-xs font-semibold text-blue-600">Selected</span>
                  )}
                </div>

                {!option.isAvailable && option.disabledReason && (
                  <p className="text-xs text-red-600 mt-2 font-medium">{option.disabledReason}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Feature Availability Notice */}
        {!options.some((opt) => opt.isAvailable && opt.id !== 'self-mark') && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              {unavailableMessage[userRole]} Only self-marking is available. For other options, check with support.
            </AlertDescription>
          </Alert>
        )}

        {/* Additional Info for Self-Marking */}
        {selectedOption === 'self-mark' && (
          <Alert className="bg-green-50 border-green-200">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              You&apos;ll be guided through the process step by step. Your location will be automatically pinpointed, and you&apos;ll draw a boundary mask over your property on the satellite map.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => selectedOption && handleSelectOption(selectedOption)}
            disabled={!selectedOption || isLoading}
          >
            {isLoading ? 'Processing...' : 'Continue'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MarkingOptionsModal;