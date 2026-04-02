'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import StateSelector from './StateSelector';
import LGASelector from './LGASelector';
import LocationSelector from './LocationSelector';
import AddressDisplay from './AddressDisplay';
import { Label } from '@newcondo/ui/components/label';

export interface NigerianAddress {
  state: string;
  lga: string;
  location: string;
  streetAddress?: string;
}

interface NigerianAddressSelectorProps {
  value?: NigerianAddress;
  onChange: (address: NigerianAddress) => void;
  showStreetAddress?: boolean;
  required?: boolean;
  disabled?: boolean;
}

export default function NigerianAddressSelector({
  value,
  onChange,
  showStreetAddress = true,
  required = false,
  disabled = false,
}: NigerianAddressSelectorProps) {
  const [selectedState, setSelectedState] = useState(value?.state || '');
  const [selectedLGA, setSelectedLGA] = useState(value?.lga || '');
  const [selectedLocation, setSelectedLocation] = useState(value?.location || '');
  const [streetAddress, setStreetAddress] = useState(value?.streetAddress || '');

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedLGA('');
    setSelectedLocation('');
    
    onChange({
      state,
      lga: '',
      location: '',
      streetAddress: showStreetAddress ? streetAddress : undefined,
    });
  };

  const handleLGAChange = (lga: string) => {
    setSelectedLGA(lga);
    setSelectedLocation('');
    
    onChange({
      state: selectedState,
      lga,
      location: '',
      streetAddress: showStreetAddress ? streetAddress : undefined,
    });
  };

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);
    
    onChange({
      state: selectedState,
      lga: selectedLGA,
      location,
      streetAddress: showStreetAddress ? streetAddress : undefined,
    });
  };

  const handleStreetAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newStreetAddress = e.target.value;
    setStreetAddress(newStreetAddress);
    
    if (selectedState && selectedLGA && selectedLocation) {
      onChange({
        state: selectedState,
        lga: selectedLGA,
        location: selectedLocation,
        streetAddress: newStreetAddress,
      });
    }
  };

  const isComplete = selectedState && selectedLGA && selectedLocation;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Property Address</CardTitle>
          <CardDescription>
            Select the hierarchical address for the property location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* State Selector */}
          <div className="space-y-2">
            <Label htmlFor="state">
              State {required && <span className="text-destructive">*</span>}
            </Label>
            <StateSelector
              value={selectedState}
              onChange={handleStateChange}
              disabled={disabled}
              required={required}
            />
          </div>

          {/* LGA Selector */}
          {selectedState && (
            <div className="space-y-2">
              <Label htmlFor="lga">
                Local Government Area {required && <span className="text-destructive">*</span>}
              </Label>
              <LGASelector
                state={selectedState}
                value={selectedLGA}
                onChange={handleLGAChange}
                disabled={disabled}
                required={required}
              />
            </div>
          )}

          {/* Location Selector */}
          {selectedState && selectedLGA && (
            <div className="space-y-2">
              <Label htmlFor="location">
                Location/Area {required && <span className="text-destructive">*</span>}
              </Label>
              <LocationSelector
                state={selectedState}
                lga={selectedLGA}
                value={selectedLocation}
                onChange={handleLocationChange}
                disabled={disabled}
                required={required}
              />
            </div>
          )}

          {/* Street Address */}
          {showStreetAddress && isComplete && (
            <div className="space-y-2">
              <Label htmlFor="streetAddress">
                Street Address (Optional)
              </Label>
              <textarea
                id="streetAddress"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter house number, street name, landmark, etc."
                value={streetAddress}
                onChange={handleStreetAddressChange}
                disabled={disabled}
              />
              <p className="text-xs text-muted-foreground">
                Provide specific details like house number, street name, or nearby landmarks
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address Display */}
      {isComplete && (
        <AddressDisplay
          address={{
            state: selectedState,
            lga: selectedLGA,
            location: selectedLocation,
            streetAddress: showStreetAddress ? streetAddress : undefined,
          }}
        />
      )}
    </div>
  );
}