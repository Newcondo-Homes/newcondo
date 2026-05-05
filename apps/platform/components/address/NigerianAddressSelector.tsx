"use client";

import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@newcondo/ui';
import { Label } from '@newcondo/ui';
import { Alert, AlertDescription } from '@newcondo/ui';
import { MapPin } from 'lucide-react';

interface AddressData {
  state: string;
  lga: string;
  location: string;
}

interface NigerianAddressSelectorProps {
  value?: AddressData;
  onChange: (address: AddressData) => void;
  disabled?: boolean;
  required?: boolean;
  showLabel?: boolean;
}

export const NigerianAddressSelector: React.FC<NigerianAddressSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  required = false,
  showLabel = true,
}) => {
  const [selectedState, setSelectedState] = useState<string>(value?.state || '');
  const [selectedLGA, setSelectedLGA] = useState<string>(value?.lga || '');
  const [selectedLocation, setSelectedLocation] = useState<string>(value?.location || '');

  const [availableLGAs, setAvailableLGAs] = useState<string[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);

  // Update parent component when values change
  useEffect(() => {
    if (selectedState && selectedLGA && selectedLocation) {
      onChange({
        state: selectedState,
        lga: selectedLGA,
        location: selectedLocation,
      });
    }
  }, [selectedState, selectedLGA, selectedLocation]);

  // Update LGAs when state changes
  useEffect(() => {
    if (selectedState) {
      const lgas = nigerianAddresses[selectedState] || {};
      setAvailableLGAs(Object.keys(lgas));
      setSelectedLGA('');
      setSelectedLocation('');
      setAvailableLocations([]);
    }
  }, [selectedState]);

  // Update locations when LGA changes
  useEffect(() => {
    if (selectedState && selectedLGA) {
      const locations = nigerianAddresses[selectedState]?.[selectedLGA] || [];
      setAvailableLocations(locations);
      setSelectedLocation('');
    }
  }, [selectedLGA]);

  return (
    <div className="space-y-4">
      {showLabel && (
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <Label className="text-base font-semibold">Property Address</Label>
          {required && <span className="text-red-500">*</span>}
        </div>
      )}

      <Alert>
        <AlertDescription>
          Select the hierarchical address of your property from State down to the specific location.
        </AlertDescription>
      </Alert>

      {/* State Selection */}
      <div className="space-y-2">
        <Label htmlFor="state">
          State {required && <span className="text-red-500">*</span>}
        </Label>
        <Select
          value={selectedState}
          onValueChange={setSelectedState}
          disabled={disabled}
          required={required}
        >
          <SelectTrigger id="state">
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(nigerianAddresses).map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* LGA Selection */}
      <div className="space-y-2">
        <Label htmlFor="lga">
          Local Government Area (LGA) {required && <span className="text-red-500">*</span>}
        </Label>
        <Select
          value={selectedLGA}
          onValueChange={setSelectedLGA}
          disabled={disabled || !selectedState}
          required={required}
        >
          <SelectTrigger id="lga">
            <SelectValue placeholder={selectedState ? 'Select LGA' : 'Select state first'} />
          </SelectTrigger>
          <SelectContent>
            {availableLGAs.map((lga) => (
              <SelectItem key={lga} value={lga}>
                {lga}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Location Selection */}
      <div className="space-y-2">
        <Label htmlFor="location">
          Location {required && <span className="text-red-500">*</span>}
        </Label>
        <Select
          value={selectedLocation}
          onValueChange={setSelectedLocation}
          disabled={disabled || !selectedLGA}
          required={required}
        >
          <SelectTrigger id="location">
            <SelectValue placeholder={selectedLGA ? 'Select location' : 'Select LGA first'} />
          </SelectTrigger>
          <SelectContent>
            {availableLocations.map((location) => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selected Address Display */}
      {selectedState && selectedLGA && selectedLocation && (
        <div className="p-3 bg-muted rounded-md">
          <p className="text-sm font-semibold mb-1">Selected Address:</p>
          <p className="text-sm">
            {selectedLocation}, {selectedLGA}, {selectedState}, Nigeria
          </p>
        </div>
      )}
    </div>
  );
};

// Comprehensive Nigerian Address Database
// This is a sample structure - expand with complete data
const nigerianAddresses: Record<string, Record<string, string[]>> = {
  Lagos: {
    'Alimosho': ['Abesan', 'Abule Egba', 'Agbado', 'Ayobo', 'Egbeda', 'Idimu', 'Ikotun', 'Ipaja'],
    'Ajeromi-Ifelodun': ['Ajegunle', 'Alaba', 'Ojo', 'Boundary'],
    'Apapa': ['Apapa', 'Ajegunle', 'Iganmu', 'Marine Beach'],
    'Eti-Osa': ['Ajah', 'Ikoyi', 'Lekki', 'Victoria Island', 'Chevron', 'Abraham Adesanya'],
    'Ikeja': ['Alausa', 'Computer Village', 'Ikeja GRA', 'Maryland', 'Ojodu', 'Omole'],
    'Lagos Island': ['Lagos Island', 'Marina', 'Onikan', 'Iddo'],
    'Lagos Mainland': ['Ebute Metta', 'Oyingbo', 'Yaba'],
    'Ikorodu': ['Ikorodu', 'Ibeshe', 'Ijede', 'Imota'],
    'Kosofe': ['Ketu', 'Maryland', 'Ojota', 'Anthony'],
    'Mushin': ['Mushin', 'Idi Araba', 'Papa Ajao'],
    'Oshodi-Isolo': ['Isolo', 'Oshodi', 'Okota', 'Ejigbo'],
    'Surulere': ['Surulere', 'Adeniran Ogunsanya', 'Ijeshatedo', 'Ojuelegba'],
  },
  Abuja: {
    'Abuja Municipal Area Council (AMAC)': [
      'Asokoro',
      'Central Business District',
      'Garki',
      'Gwarimpa',
      'Jabi',
      'Maitama',
      'Utako',
      'Wuse',
      'Wuse 2',
    ],
    'Gwagwalada': ['Gwagwalada', 'Tunga', 'Kutunku'],
    'Kuje': ['Kuje', 'Rubochi', 'Chibiri'],
    'Bwari': ['Bwari', 'Dutse Alhaji', 'Kubwa', 'Dutse'],
  },
  'Rivers': {
    'Port Harcourt': ['GRA', 'Rumuola', 'Rumuokoro', 'Trans Amadi', 'Woji', 'Eliozu', 'Ada George'],
    'Obio-Akpor': ['Choba', 'Rumuigbo', 'Rumuokwuta', 'Rukpokwu'],
  },
  Ogun: {
    'Abeokuta South': ['Abeokuta', 'Iberekodo', 'Isale Igbein'],
    'Ifo': ['Ifo', 'Agbado', 'Isheri'],
    'Ado-Odo/Ota': ['Ota', 'Sango', 'Joju', 'Iju'],
  },
  Oyo: {
    'Ibadan North': ['Agodi', 'Bodija', 'Jericho', 'Mokola', 'Sango'],
    'Ibadan South-West': ['Ring Road', 'Oke Ado', 'Molete'],
  },
  Kano: {
    'Kano Municipal': ['Bompai', 'Gwale', 'Kofar Ruwa', 'Nassarawa', 'Sabon Gari'],
  },
  Kaduna: {
    'Kaduna North': ['Kaduna North', 'Barnawa', 'Rigasa', 'Tudun Wada'],
    'Kaduna South': ['Television', 'Narayi', 'Kakuri'],
  },
  Delta: {
    'Warri': ['Warri', 'Effurun', 'Ekpan', 'PTI'],
    'Ughelli': ['Ughelli', 'Ogor', 'Olomoro'],
  },
  Enugu: {
    'Enugu North': ['Achara Layout', 'GRA', 'Independence Layout', 'Ogui', 'Trans Ekulu'],
    'Enugu South': ['Maryland', 'New Haven', 'Uwani'],
  },
  Anambra: {
    'Awka North': ['Awka', 'Amaenyi', 'Okpuno'],
    'Onitsha North': ['Onitsha', '3-3', 'Fegge', 'GRA', 'Inland Town'],
  },
  Edo: {
    'Ikpoba-Okha': ['Benin City', 'Ugbowo', 'Uselu'],
  },
  'Akwa Ibom': {
    'Uyo': ['Uyo', 'Itam', 'Use Offot', 'Nwaniba'],
  },
  'Cross River': {
    'Calabar Municipal': ['Calabar', 'Big Qua', 'Ekpo Abasi'],
  },
  Ondo: {
    'Akure South': ['Akure', 'Alagbaka', 'FUTA'],
  },
  Osun: {
    'Osogbo': ['Osogbo', 'Oke Fia', 'Oke Baale'],
  },
  Ekiti: {
    'Ado-Ekiti': ['Ado Ekiti', 'Ajilosun', 'Basiri'],
  },
  Kwara: {
    'Ilorin West': ['Ilorin', 'GRA', 'Fate', 'Tanke'],
  },
  Plateau: {
    'Jos North': ['Jos', 'Bukuru', 'Rayfield'],
  },
  Bauchi: {
    'Bauchi': ['Bauchi', 'GRA', 'Muda Lawal'],
  },
  Borno: {
    'Maiduguri': ['Maiduguri', 'Gwange', 'Bulumkutu'],
  },
};