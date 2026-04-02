'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@newcondo/ui/components/select';

// Nigerian Locations by State and LGA - Sample data
const NIGERIAN_LOCATIONS: Record<string, Record<string, string[]>> = {
  Lagos: {
    Ikeja: [
      'Alausa',
      'Allen Avenue',
      'Computer Village',
      'GRA',
      'Ikeja Along',
      'Maryland',
      'Ogba',
      'Ojodu',
      'Omole Phase 1',
      'Omole Phase 2',
      'Oregun',
      'Opebi',
    ],
    'Eti Osa': [
      'Ajah',
      'Chevron',
      'Ikoyi',
      'Lekki Phase 1',
      'Lekki Phase 2',
      'Oniru',
      'Osapa London',
      'Sangotedo',
      'Victoria Island',
      'VGC',
    ],
    'Lagos Island': [
      'CMS',
      'Ikoyi',
      'Lagos Island',
      'Marina',
      'Obalende',
      'Victoria Island',
    ],
    Surulere: [
      'Adeniran Ogunsanya',
      'Aguda',
      'Ijeshatedo',
      'Itire',
      'Ojuelegba',
      'Shitta',
    ],
    Alimosho: [
      'Akowonjo',
      'Egbeda',
      'Idimu',
      'Ikotun',
      'Ipaja',
      'Isheri Olofin',
    ],
    Ikorodu: [
      'Agric',
      'Beside',
      'Ebute',
      'Ijede',
      'Ikorodu Town',
      'Isawo',
      'Ogolonto',
    ],
    'Ibeju-Lekki': [
      'Abijo',
      'Awoyaya',
      'Bogije',
      'Eleko',
      'Ibeju',
      'Lakowe',
      'Shapati',
    ],
  },
  FCT: {
    'Abuja Municipal': [
      'Asokoro',
      'Central Business District',
      'Garki',
      'Guzape',
      'Jabi',
      'Jahi',
      'Maitama',
      'Utako',
      'Wuse',
      'Wuse 2',
    ],
    Gwagwalada: [
      'Gwagwalada Town',
      'Kutunku',
      'Paikon-Kore',
      'Tungan-Maje',
    ],
    Bwari: [
      'Bwari Town',
      'Dutse',
      'Kubwa',
      'Lugbe',
      'Ushafa',
    ],
  },
  Rivers: {
    'Port Harcourt': [
      'Amadi-Ama',
      'Borokiri',
      'Diobu',
      'GRA Phase 1',
      'GRA Phase 2',
      'Old GRA',
      'Port Harcourt Township',
      'Rumuokoro',
      'Trans Amadi',
    ],
    'Obio/Akpor': [
      'Choba',
      'Eliozu',
      'Elelenwo',
      'Mgbuoba',
      'Rumueme',
      'Rumuokwurushi',
      'Rumuola',
      'Woji',
    ],
  },
  Ogun: {
    'Abeokuta South': [
      'Abeokuta',
      'Ake',
      'Ijaye',
      'Isabo',
      'Lantoro',
      'Sokori',
    ],
    'Ado-Odo/Ota': [
      'Ado-Odo',
      'Agbara',
      'Ijoko',
      'Ilogbo',
      'Ota',
      'Sango',
    ],
    Sagamu: [
      'Ewu',
      'Makun',
      'Ogijo',
      'Sagamu Town',
      'Simawa',
    ],
  },
};

interface LocationSelectorProps {
  state: string;
  lga: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}

export default function LocationSelector({
  state,
  lga,
  value,
  onChange,
  disabled = false,
  required = false,
}: LocationSelectorProps) {
  const locations = NIGERIAN_LOCATIONS[state]?.[lga] || [];

  if (!state || !lga || locations.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger id="location">
          <SelectValue placeholder="Select LGA first" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled} required={required}>
      <SelectTrigger id="location">
        <SelectValue placeholder="Select location/area" />
      </SelectTrigger>
      <SelectContent>
        {locations.map((location) => (
          <SelectItem key={location} value={location}>
            {location}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}