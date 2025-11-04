// apps/platform/components/marketing/PromotionSettings.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type PromotionType = 'PUBLIC' | 'PERMISSION_BASED' | 'RESTRICTED' | 'REQUEST_BASED';

interface PromotionSettingsProps {
  propertyId: string;
  currentSetting: PromotionType;
  onSave: (setting: PromotionType) => Promise<void>;
}

export function PromotionSettings({
  propertyId,
  currentSetting,
  onSave,
}: PromotionSettingsProps) {
  const [selectedSetting, setSelectedSetting] = useState<PromotionType>(currentSetting);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const promotionOptions = [
    {
      value: 'PUBLIC' as PromotionType,
      label: 'Public Promotion',
      description:
        'Anyone can share this property. A "Share" button will be visible to all users.',
    },
    {
      value: 'PERMISSION_BASED' as PromotionType,
      label: 'Permission-Based Promotion',
      description:
        'Sub-agents can request to promote by clicking a "Promote" button, which generates a unique tracking link.',
    },
    {
      value: 'REQUEST_BASED' as PromotionType,
      label: 'Request-Based Promotion',
      description:
        'Restricted, but sub-agents can request permission to promote. You must approve each request.',
    },
    {
      value: 'RESTRICTED' as PromotionType,
      label: 'No Promotion',
      description:
        'Only you can promote this property. Other agents cannot share or promote it.',
    },
  ];

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(selectedSetting);
      toast({
        title: 'Settings saved',
        description: 'Promotion settings have been updated successfully',
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to update promotion settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = selectedSetting !== currentSetting;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Promotion Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Control how other agents can promote and share this property. Your
            choice affects commission distribution.
          </AlertDescription>
        </Alert>

        <RadioGroup
          value={selectedSetting}
          onValueChange={(value) => setSelectedSetting(value as PromotionType)}
        >
          {promotionOptions.map((option) => (
            <div
              key={option.value}
              className="flex items-start space-x-3 space-y-0 rounded-md border p-4"
            >
              <RadioGroupItem value={option.value} id={option.value} />
              <div className="flex-1">
                <Label
                  htmlFor={option.value}
                  className="font-medium cursor-pointer"
                >
                  {option.label}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {option.description}
                </p>
              </div>
            </div>
          ))}
        </RadioGroup>

        {selectedSetting === 'PERMISSION_BASED' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              When a sub-agent promotes this property through their link, they
              will receive 50% of your commission share (5% of total rent).
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}