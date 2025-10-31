'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { XCircle, AlertCircle, Send } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface PropertyRejectionFormProps {
  propertyId: string;
  propertyTitle: string;
  onSubmit: (propertyId: string, reason: string, categories: string[]) => Promise<void>;
  onCancel?: () => void;
}

export function PropertyRejectionForm({
  propertyId,
  propertyTitle,
  onSubmit,
  onCancel,
}: PropertyRejectionFormProps) {
  const [reason, setReason] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rejectionCategories = [
    {
      id: 'incomplete-info',
      label: 'Incomplete Information',
      description: 'Missing essential property details',
    },
    {
      id: 'poor-images',
      label: 'Poor Quality Images',
      description: 'Images are unclear, blurry, or insufficient',
    },
    {
      id: 'boundary-issue',
      label: 'Boundary Issues',
      description: 'Property boundary not marked or incorrectly marked',
    },
    {
      id: 'missing-docs',
      label: 'Missing Documents',
      description: 'Required legal documents not provided',
    },
    {
      id: 'invalid-docs',
      label: 'Invalid Documents',
      description: 'Documents appear fake, expired, or tampered',
    },
    {
      id: 'duplicate',
      label: 'Duplicate Listing',
      description: 'Property already listed on the platform',
    },
    {
      id: 'unreasonable-price',
      label: 'Unreasonable Pricing',
      description: 'Price significantly above or below market rate',
    },
    {
      id: 'unverified-location',
      label: 'Unverifiable Location',
      description: 'Cannot verify property address or location',
    },
    {
      id: 'suspicious',
      label: 'Suspicious Activity',
      description: 'Property or user activity appears fraudulent',
    },
    {
      id: 'policy-violation',
      label: 'Policy Violation',
      description: 'Violates platform terms and conditions',
    },
  ];

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = new Set(selectedCategories);
    if (newCategories.has(categoryId)) {
      newCategories.delete(categoryId);
    } else {
      newCategories.add(categoryId);
    }
    setSelectedCategories(newCategories);
  };

  const handleQuickReason = (categoryId: string) => {
    const category = rejectionCategories.find((c) => c.id === categoryId);
    if (category) {
      setReason((prev) => {
        const newReason = prev ? `${prev}\n\n${category.description}` : category.description;
        return newReason;
      });
    }
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a detailed reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    if (selectedCategories.size === 0) {
      toast({
        title: 'Category Required',
        description: 'Please select at least one rejection category',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(propertyId, reason, Array.from(selectedCategories));
      toast({
        title: 'Property Rejected',
        description: 'The property owner has been notified of the rejection.',
      });
    } catch (error) {
      toast({
        title: 'Rejection Failed',
        description: error instanceof Error ? error.message : 'Failed to reject property',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <XCircle className="h-5 w-5" />
          Reject Property Listing
        </CardTitle>
        <CardDescription>
          Provide clear feedback to help the owner resubmit correctly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Property Info */}
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-sm text-gray-600">Property:</p>
          <p className="font-semibold text-gray-900">{propertyTitle}</p>
          <p className="text-xs text-gray-500">ID: {propertyId}</p>
        </div>

        {/* Rejection Categories */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Rejection Categories *</Label>
          <p className="text-sm text-gray-600">
            Select all issues that apply (at least one required)
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {rejectionCategories.map((category) => (
              <div
                key={category.id}
                className={`rounded-lg border p-3 transition-colors ${
                  selectedCategories.has(category.id)
                    ? 'border-red-300 bg-red-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <label className="flex cursor-pointer items-start gap-3">
                  <Checkbox
                    checked={selectedCategories.has(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{category.label}</p>
                    <p className="text-xs text-gray-600">{category.description}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-auto p-0 text-xs text-blue-600"
                      onClick={() => handleQuickReason(category.id)}
                    >
                      Add to reason
                    </Button>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Reason */}
        <div className="space-y-2">
          <Label htmlFor="rejection-reason" className="text-base font-semibold">
            Detailed Reason *
          </Label>
          <p className="text-sm text-gray-600">
            Provide specific, actionable feedback the owner can use to improve their listing
          </p>
          <Textarea
            id="rejection-reason"
            placeholder="Example: The property images are too dark and blurry. Please retake photos in good lighting. Additionally, the Certificate of Occupancy document appears to be expired (dated 2020). Please upload a current valid document."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={8}
            disabled={isSubmitting}
            className="font-normal"
          />
          <p className="text-xs text-gray-500">
            Character count: {reason.length} (minimum 50 recommended)
          </p>
        </div>

        {/* Guidelines */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Rejection Guidelines:</strong>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
              <li>Be specific about what needs to be fixed</li>
              <li>Provide clear, actionable feedback</li>
              <li>Maintain a professional and helpful tone</li>
              <li>List all issues to avoid multiple rejections</li>
              <li>Reference specific documents or images if applicable</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Warning */}
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The property owner will receive this feedback via email and can resubmit after making
            corrections. This action cannot be undone.
          </AlertDescription>
        </Alert>

        {/* Actions */}
        <div className="flex gap-3 border-t pt-4">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim() || selectedCategories.size === 0}
            variant="destructive"
            className="flex-1"
          >
            {isSubmitting ? (
              'Submitting...'
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Rejection
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}