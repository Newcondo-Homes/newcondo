// apps/platform/components/properties/PropertyEditForm.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Input } from '@newcondo/ui/components/input';
import { Label } from '@newcondo/ui/components/label';
import { Textarea } from '@newcondo/ui/components/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@newcondo/ui/components/select';
import { Checkbox } from '@newcondo/ui/components/checkbox';
import { toast } from '@newcondo/ui';
import { Save, X } from 'lucide-react';
import { PropertyType } from '@newcondo/db';

interface PropertyEditData {
  id: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  features: string[];
  address: string;
  city: string;
  state: string;
  structure: 'SINGLE_UNIT' | 'MULTI_FAMILY';
}

interface PropertyEditFormProps {
  property: PropertyEditData;
  onSave: (data: PropertyEditData) => Promise<void>;
  onCancel: () => void;
}

const propertyTypes: PropertyType[] = [
  'APARTMENT',
  'HOUSE',
  'DUPLEX',
  'ROOM',
  'SHARED_APARTMENT',
  'OFFICE',
  'SHOP',
  'WAREHOUSE',
];

const nigerianStates = [
  'Lagos',
  'Abuja',
  'Kano',
  'Rivers',
  'Oyo',
  'Kaduna',
  'Enugu',
  'Delta',
  'Ogun',
  'Edo',
];

const commonFeatures = [
  'Parking',
  'Generator',
  'Security',
  'Water Supply',
  'Internet',
  'Swimming Pool',
  'Gym',
  'Garden',
  'Balcony',
  'Elevator',
];

export function PropertyEditForm({
  property,
  onSave,
  onCancel,
}: PropertyEditFormProps) {
  const [formData, setFormData] = useState<PropertyEditData>(property);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = <K extends keyof PropertyEditData>(
    field: K,
    value: PropertyEditData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onSave(formData);
      toast.success('Property updated', {
        description: 'Your property has been updated successfully',
      });
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Save failed', {
        description: 'Failed to update property',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Edit Property</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>

            <div className="space-y-2">
              <Label htmlFor="title">Property Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type *</Label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value) =>
                    handleChange('propertyType', value as PropertyType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (NGN) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    handleChange('price', parseFloat(e.target.value))
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* Property Details */}
          {formData.structure === 'SINGLE_UNIT' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Property Details</h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min="0"
                    value={formData.bedrooms ?? ''}
                    onChange={(e) =>
                      handleChange('bedrooms', parseInt(e.target.value))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min="0"
                    value={formData.bathrooms ?? ''}
                    onChange={(e) =>
                      handleChange('bathrooms', parseInt(e.target.value))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area">Area (sqm)</Label>
                  <Input
                    id="area"
                    value={formData.area ?? ''}
                    onChange={(e) => handleChange('area', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Features & Amenities</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {commonFeatures.map((feature) => (
                <div key={feature} className="flex items-center space-x-2">
                  <Checkbox
                    id={feature}
                    checked={formData.features.includes(feature)}
                    onCheckedChange={() => handleFeatureToggle(feature)}
                  />
                  <Label
                    htmlFor={feature}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {feature}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Location</h3>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => handleChange('state', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {nigerianStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}