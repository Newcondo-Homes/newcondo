'use client'

import { useState, useEffect, useCallback } from 'react';

// Hierarchical structure: State -> LGA -> Location
interface NigerianAddress {
  state: string;
  lga: string;
  location: string;
}

interface AddressOption {
  value: string;
  label: string;
}

interface UseNigerianAddressReturn {
  // Selected values
  selectedState: string;
  selectedLGA: string;
  selectedLocation: string;
  
  // Options
  states: AddressOption[];
  lgas: AddressOption[];
  locations: AddressOption[];
  
  // Actions
  setSelectedState: (state: string) => void;
  setSelectedLGA: (lga: string) => void;
  setSelectedLocation: (location: string) => void;
  resetAddress: () => void;
  
  // Utilities
  getFullAddress: () => NigerianAddress | null;
  isAddressComplete: boolean;
  loading: boolean;
  error: string | null;
}

// Comprehensive Nigerian geography data structure
const NIGERIAN_GEOGRAPHY: Record<string, Record<string, string[]>> = {
  'Lagos': {
    'Alimosho': ['Akowonjo', 'Egbeda', 'Idimu', 'Ikotun', 'Ipaja', 'Iyana-Ipaja'],
    'Ajeromi-Ifelodun': ['Ajegunle', 'Apapa Road', 'Boundary', 'Olodi'],
    'Kosofe': ['Ketu', 'Mile 12', 'Oworonshoki', 'Anthony'],
    'Mushin': ['Mushin', 'Idi-Araba', 'Papa Ajao', 'Odi-Olowo'],
    'Oshodi-Isolo': ['Oshodi', 'Isolo', 'Mafoluku', 'Okota'],
    'Ojo': ['Ojo', 'Ajangbadi', 'Etegbin', 'Okokomaiko'],
    'Ikorodu': ['Ikorodu', 'Agbowa', 'Igbogbo', 'Imota'],
    'Surulere': ['Surulere', 'Adeniran Ogunsanya', 'Itire', 'Shitta'],
    'Agege': ['Agege', 'Dopemu', 'Mangoro', 'Pen Cinema'],
    'Ifako-Ijaiye': ['Ifako', 'Ijaiye', 'Alakuko', 'Alagbado'],
    'Somolu': ['Somolu', 'Bariga', 'Pedro', 'Shomolu'],
    'Amuwo-Odofin': ['Festac', 'Amuwo-Odofin', 'Mile 2', 'Trade Fair'],
    'Lagos Mainland': ['Yaba', 'Ebute Metta', 'Oyingbo', 'Sabo'],
    'Ikeja': ['Ikeja', 'Allen', 'Alausa', 'Computer Village', 'GRA', 'Maryland'],
    'Eti-Osa': ['Lekki', 'Victoria Island', 'Ikoyi', 'Ajah', 'Ado', 'Badore'],
    'Badagry': ['Badagry', 'Ajara', 'Ikoga', 'Ibereko'],
    'Apapa': ['Apapa', 'Ijora', 'Tincan Island', 'Wharf'],
    'Lagos Island': ['Lagos Island', 'Marina', 'Broad Street', 'Isale Eko'],
    'Epe': ['Epe', 'Ejinrin', 'Eredo', 'Poka'],
    'Ibeju-Lekki': ['Ibeju-Lekki', 'Awoyaya', 'Lakowe', 'Bogije']
  },
  'Abuja': {
    'Abaji': ['Abaji', 'Gawu', 'Pandaki', 'Yaba'],
    'Bwari': ['Bwari', 'Dutse', 'Kubwa', 'Byazhin'],
    'Gwagwalada': ['Gwagwalada', 'Zuba', 'Tunga Maje', 'Dobi'],
    'Kuje': ['Kuje', 'Chibiri', 'Gudun Karya', 'Kwaku'],
    'Kwali': ['Kwali', 'Kilankwa', 'Pai', 'Yebu'],
    'Municipal Area Council': ['Asokoro', 'Central Business District', 'Garki', 'Gudu', 'Gwarimpa', 'Jabi', 'Jahi', 'Kado', 'Lugbe', 'Maitama', 'Utako', 'Wuse', 'Wuye']
  },
  'Rivers': {
    'Port Harcourt': ['Port Harcourt', 'Diobu', 'Rumuola', 'GRA', 'Trans Amadi'],
    'Obio-Akpor': ['Rumuokoro', 'Rumuogba', 'Eliozu', 'Choba'],
    'Ikwerre': ['Isiokpo', 'Elele', 'Omagwa', 'Omerelu'],
    'Emohua': ['Emohua', 'Rumuji', 'Egbeda', 'Ubimini'],
    'Oyigbo': ['Oyigbo', 'Afam', 'Komkom', 'Ndele']
  },
  'Oyo': {
    'Ibadan North': ['Bodija', 'Sango', 'Agbowo', 'Mokola'],
    'Ibadan South-West': ['Ring Road', 'Oke-Ado', 'Molete'],
    'Ibadan North-East': ['Iwo Road', 'Apata', 'Soka'],
    'Akinyele': ['Moniya', 'Akinyele', 'Ijaye'],
    'Lagelu': ['Lalupon', 'Ejioku', 'Iyana Offa']
  },
  'Kano': {
    'Kano Municipal': ['Sabon Gari', 'Fagge', 'Kofar Wambai', 'Rijiyar Lemo'],
    'Nassarawa': ['Nassarawa', 'Bompai', 'Zoo Road'],
    'Gwale': ['Gwale', 'Kabuga', 'Rijiyar Zaki'],
    'Dala': ['Dala', 'Goron Dutse', 'Gwammaja'],
    'Tarauni': ['Tarauni', 'Yankaba', 'Panshekara']
  },
  'Kaduna': {
    'Kaduna North': ['Kaduna North', 'Sabon Gari', 'Tudun Wada', 'Unguwan Dosa'],
    'Kaduna South': ['Barnawa', 'Television', 'Kakuri', 'Makera'],
    'Chikun': ['Narayi', 'Gonin Gora', 'Kujama'],
    'Igabi': ['Rigachikun', 'Turunku', 'Rigasa']
  },
  'Anambra': {
    'Awka North': ['Awka', 'Amaenyi', 'Ifite', 'Nkwelle'],
    'Onitsha North': ['Onitsha', 'Inland Town', 'GRA', 'Fegge'],
    'Nnewi North': ['Nnewi', 'Otolo', 'Uruagu', 'Umudim'],
    'Ogbaru': ['Atani', 'Okpoko', 'Ossomala']
  },
  'Enugu': {
    'Enugu North': ['Ogui', 'Asata', 'Abakpa', 'GRA'],
    'Enugu South': ['Trans Ekulu', 'Uwani', 'Achara Layout'],
    'Enugu East': ['Emene', 'New Haven', 'Independence Layout'],
    'Nkanu West': ['Agbani', 'Nkanu', 'Amechi']
  },
  'Delta': {
    'Warri South': ['Warri', 'Effurun', 'Ugbomro', 'Ekpan'],
    'Ughelli North': ['Ughelli', 'Ogor', 'Agbarho'],
    'Sapele': ['Sapele', 'Okirighwre', 'Amukpe'],
    'Uvwie': ['Effurun', 'Ekpan', 'Ugbolokposo']
  },
  'Edo': {
    'Oredo': ['Benin City', 'Ring Road', 'Ugbowo', 'GRA'],
    'Egor': ['Uselu', 'Egor', 'Evbotubu'],
    'Ikpoba-Okha': ['Idogbo', 'Oregbeni', 'Ugbekun'],
    'Ovia North-East': ['Okada', 'Iguobazuwa', 'Uteh']
  },
  'Ogun': {
    'Ado-Odo/Ota': ['Ota', 'Ado-Odo', 'Sango', 'Ijoko'],
    'Abeokuta South': ['Abeokuta', 'Ake', 'Isabo', 'Itoku'],
    'Ifo': ['Ifo', 'Agbado', 'Isheri', 'Ibogun'],
    'Sagamu': ['Sagamu', 'Makun', 'Ogijo', 'Simawa']
  }
};

export const useNigerianAddress = (
  initialState = '',
  initialLGA = '',
  initialLocation = ''
): UseNigerianAddressReturn => {
  const [selectedState, setSelectedState] = useState<string>(initialState);
  const [selectedLGA, setSelectedLGA] = useState<string>(initialLGA);
  const [selectedLocation, setSelectedLocation] = useState<string>(initialLocation);
  
  const [lgas, setLgas] = useState<AddressOption[]>([]);
  const [locations, setLocations] = useState<AddressOption[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate state options
  const states: AddressOption[] = Object.keys(NIGERIAN_GEOGRAPHY)
    .sort()
    .map(state => ({
      value: state,
      label: state
    }));

  // Update LGAs when state changes
  useEffect(() => {
    if (selectedState) {
      const stateLGAs = NIGERIAN_GEOGRAPHY[selectedState];
      if (stateLGAs) {
        const lgaOptions = Object.keys(stateLGAs)
          .sort()
          .map(lga => ({
            value: lga,
            label: lga
          }));
        setLgas(lgaOptions);
      } else {
        setLgas([]);
      }
      
      // Reset LGA and location when state changes
      if (selectedState !== initialState) {
        setSelectedLGA('');
        setSelectedLocation('');
      }
    } else {
      setLgas([]);
    }
  }, [selectedState, initialState]);

  // Update locations when LGA changes
  useEffect(() => {
    if (selectedState && selectedLGA) {
      const lgaLocations = NIGERIAN_GEOGRAPHY[selectedState]?.[selectedLGA];
      if (lgaLocations) {
        const locationOptions = lgaLocations
          .sort()
          .map(location => ({
            value: location,
            label: location
          }));
        setLocations(locationOptions);
      } else {
        setLocations([]);
      }
      
      // Reset location when LGA changes
      if (selectedLGA !== initialLGA) {
        setSelectedLocation('');
      }
    } else {
      setLocations([]);
    }
  }, [selectedState, selectedLGA, initialLGA]);

  // Reset address to initial state
  const resetAddress = useCallback(() => {
    setSelectedState('');
    setSelectedLGA('');
    setSelectedLocation('');
    setLgas([]);
    setLocations([]);
    setError(null);
  }, []);

  // Get full address object
  const getFullAddress = useCallback((): NigerianAddress | null => {
    if (selectedState && selectedLGA && selectedLocation) {
      return {
        state: selectedState,
        lga: selectedLGA,
        location: selectedLocation
      };
    }
    return null;
  }, [selectedState, selectedLGA, selectedLocation]);

  // Check if address is complete
  const isAddressComplete = Boolean(selectedState && selectedLGA && selectedLocation);

  return {
    selectedState,
    selectedLGA,
    selectedLocation,
    states,
    lgas,
    locations,
    setSelectedState,
    setSelectedLGA,
    setSelectedLocation,
    resetAddress,
    getFullAddress,
    isAddressComplete,
    loading,
    error
  };
};

// Utility function to format address as string
export const formatAddress = (address: NigerianAddress | null): string => {
  if (!address) return '';
  return `${address.location}, ${address.lga}, ${address.state}`;
};

// Utility function to validate address
export const validateNigerianAddress = (address: Partial<NigerianAddress>): boolean => {
  if (!address.state || !address.lga || !address.location) {
    return false;
  }
  
  // Check if state exists
  const stateData = NIGERIAN_GEOGRAPHY[address.state];
  if (!stateData) return false;
  
  // Check if LGA exists in state
  const lgaData = stateData[address.lga];
  if (!lgaData) return false;
  
  // Check if location exists in LGA
  return lgaData.includes(address.location);
};

// Export geography data for other components if needed
export { NIGERIAN_GEOGRAPHY };