// apps/platform/lib/constants/locations.ts

export interface Location {
  id: string;
  name: string;
  state: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isPopular?: boolean;
}

export interface State {
  id: string;
  name: string;
  country: string;
  cities: Location[];
}

// Major Nigerian cities organized by state
export const NIGERIAN_STATES: State[] = [
  {
    id: 'lagos',
    name: 'Lagos',
    country: 'Nigeria',
    cities: [
      {
        id: 'ikeja',
        name: 'Ikeja',
        state: 'Lagos',
        country: 'Nigeria',
        coordinates: { lat: 6.5942, lng: 3.3375 },
        isPopular: true
      },
      {
        id: 'victoria_island',
        name: 'Victoria Island',
        state: 'Lagos',
        country: 'Nigeria',
        coordinates: { lat: 6.4281, lng: 3.4219 },
        isPopular: true
      },
      {
        id: 'lekki',
        name: 'Lekki',
        state: 'Lagos',
        country: 'Nigeria',
        coordinates: { lat: 6.4698, lng: 3.5852 },
        isPopular: true
      },
      {
        id: 'ikoyi',
        name: 'Ikoyi',
        state: 'Lagos',
        country: 'Nigeria',
        coordinates: { lat: 6.4541, lng: 3.4316 },
        isPopular: true
      },
      {
        id: 'surulere',
        name: 'Surulere',
        state: 'Lagos',
        country: 'Nigeria',
        coordinates: { lat: 6.4969, lng: 3.3515 },
        isPopular: true
      },
      {
        id: 'yaba',
        name: 'Yaba',
        state: 'Lagos',
        country: 'Nigeria',
        coordinates: { lat: 6.5158, lng: 3.3696 },
        isPopular: true
      },
      {
        id: 'mainland',
        name: 'Lagos Mainland',
        state: 'Lagos',
        country: 'Nigeria',
        coordinates: { lat: 6.5244, lng: 3.3792 }
      },
      {
        id: 'island',
        name: 'Lagos Island',
        state: 'Lagos',
        country: 'Nigeria',
        coordinates: { lat: 6.4541, lng: 3.3947 }
      },
      {
        id: 'gbagada',
        name: 'Gbagada',
        state: 'Lagos',
        country: 'Nigeria',
        coordinates: { lat: 6.5447, lng: 3.3957 }
      },
      {
        id: 'magodo',
        name: 'Magodo',
        state: 'Lagos',
        country: 'Nigeria',
        coordinates: { lat: 6.5833, lng: 3.3833 }
      },
      {
        id: 'maryland',
        name: 'Maryland',
        state: 'Lagos',
        country: 'Nigeria',
        coordinates: { lat: 6.5698, lng: 3.3644 }
      },
      {
        id: 'ogba',
        name: 'Ogba',
        state: 'Lagos',
        country: 'Nigeria',
        coordinates: { lat: 6.6344, lng: 3.3447 }
      },
      {
        id: 'anthony',
        name: 'Anthony',
        state: 'Lagos',
        country: 'Nigeria',
        coordinates: { lat: 6.5833, lng: 3.3667 }
      },
      {
        id: 'ajah',
        name: 'Ajah',
        state: 'Lagos',
        country: 'Nigeria',
        coordinates: { lat: 6.4667, lng: 3.5667 }
      },
      {
        id: 'festac',
        name: 'Festac Town',
        state: 'Lagos',
        country: 'Nigeria',
        coordinates: { lat: 6.4667, lng: 3.2833 }
      }
    ]
  },
  {
    id: 'fct',
    name: 'Federal Capital Territory',
    country: 'Nigeria',
    cities: [
      {
        id: 'abuja',
        name: 'Abuja',
        state: 'Federal Capital Territory',
        country: 'Nigeria',
        coordinates: { lat: 9.0579, lng: 7.4951 },
        isPopular: true
      },
      {
        id: 'garki',
        name: 'Garki',
        state: 'Federal Capital Territory',
        country: 'Nigeria',
        coordinates: { lat: 9.0333, lng: 7.4833 },
        isPopular: true
      },
      {
        id: 'maitama',
        name: 'Maitama',
        state: 'Federal Capital Territory',
        country: 'Nigeria',
        coordinates: { lat: 9.0833, lng: 7.5000 },
        isPopular: true
      },
      {
        id: 'wuse',
        name: 'Wuse',
        state: 'Federal Capital Territory',
        country: 'Nigeria',
        coordinates: { lat: 9.0667, lng: 7.4833 },
        isPopular: true
      },
      {
        id: 'gwarinpa',
        name: 'Gwarinpa',
        state: 'Federal Capital Territory',
        country: 'Nigeria',
        coordinates: { lat: 9.1167, lng: 7.4167 }
      },
      {
        id: 'kubwa',
        name: 'Kubwa',
        state: 'Federal Capital Territory',
        country: 'Nigeria',
        coordinates: { lat: 9.1500, lng: 7.3500 }
      }
    ]
  },
  {
    id: 'rivers',
    name: 'Rivers',
    country: 'Nigeria',
    cities: [
      {
        id: 'port_harcourt',
        name: 'Port Harcourt',
        state: 'Rivers',
        country: 'Nigeria',
        coordinates: { lat: 4.8156, lng: 7.0498 },
        isPopular: true
      },
      {
        id: 'obio_akpor',
        name: 'Obio-Akpor',
        state: 'Rivers',
        country: 'Nigeria',
        coordinates: { lat: 4.8833, lng: 7.0167 }
      }
    ]
  },
  {
    id: 'kano',
    name: 'Kano',
    country: 'Nigeria',
    cities: [
      {
        id: 'kano_city',
        name: 'Kano',
        state: 'Kano',
        country: 'Nigeria',
        coordinates: { lat: 11.9999, lng: 8.5200 },
        isPopular: true
      }
    ]
  },
  {
    id: 'kaduna',
    name: 'Kaduna',
    country: 'Nigeria',
    cities: [
      {
        id: 'kaduna_city',
        name: 'Kaduna',
        state: 'Kaduna',
        country: 'Nigeria',
        coordinates: { lat: 10.5222, lng: 7.4383 },
        isPopular: true
      }
    ]
  },
  {
    id: 'ogun',
    name: 'Ogun',
    country: 'Nigeria',
    cities: [
      {
        id: 'abeokuta',
        name: 'Abeokuta',
        state: 'Ogun',
        country: 'Nigeria',
        coordinates: { lat: 7.1475, lng: 3.3619 }
      }
    ]
  },
  {
    id: 'oyo',
    name: 'Oyo',
    country: 'Nigeria',
    cities: [
      {
        id: 'ibadan',
        name: 'Ibadan',
        state: 'Oyo',
        country: 'Nigeria',
        coordinates: { lat: 7.3775, lng: 3.9470 },
        isPopular: true
      }
    ]
  },
  {
    id: 'plateau',
    name: 'Plateau',
    country: 'Nigeria',
    cities: [
      {
        id: 'jos',
        name: 'Jos',
        state: 'Plateau',
        country: 'Nigeria',
        coordinates: { lat: 9.9285, lng: 8.8921 }
      }
    ]
  },
  {
    id: 'enugu',
    name: 'Enugu',
    country: 'Nigeria',
    cities: [
      {
        id: 'enugu_city',
        name: 'Enugu',
        state: 'Enugu',
        country: 'Nigeria',
        coordinates: { lat: 6.5244, lng: 7.5086 }
      }
    ]
  },
  {
    id: 'delta',
    name: 'Delta',
    country: 'Nigeria',
    cities: [
      {
        id: 'warri',
        name: 'Warri',
        state: 'Delta',
        country: 'Nigeria',
        coordinates: { lat: 5.5160, lng: 5.7500 }
      }
    ]
  }
];

// Flatten all cities for easy searching
export const ALL_CITIES: Location[] = NIGERIAN_STATES.reduce(
  (cities, state) => [...cities, ...state.cities],
  [] as Location[]
);

// Popular cities (frequently searched)
export const POPULAR_CITIES = ALL_CITIES.filter(city => city.isPopular);

// Lagos areas for detailed search
export const LAGOS_AREAS = [
  'Victoria Island', 'Lekki', 'Ikoyi', 'Ikeja', 'Surulere', 'Yaba',
  'Gbagada', 'Maryland', 'Magodo', 'Ogba', 'Anthony', 'Ajah', 'Festac Town',
  'Oshodi', 'Mushin', 'Alaba', 'Ketu', 'Ojota', 'Mile 12', 'Berger',
  'Agege', 'Egbeda', 'Ipaja', 'Ikorodu', 'Epe', 'Badagry', 'Apapa'
];

// Abuja areas for detailed search
export const ABUJA_AREAS = [
  'Maitama', 'Asokoro', 'Wuse 2', 'Garki', 'Gwarinpa', 'Kubwa',
  'Jahi', 'Katampe', 'Lokogoma', 'Kado', 'Life Camp', 'Guzape',
  'Utako', 'Jabi', 'Durumi', 'Galadimawa', 'Kaura', 'Kuje'
];

// Helper functions
export const getCitiesByState = (stateId: string) => {
  const state = NIGERIAN_STATES.find(s => s.id === stateId);
  return state ? state.cities : [];
};

export const getStateByCity = (cityId: string) => {
  for (const state of NIGERIAN_STATES) {
    if (state.cities.some(city => city.id === cityId)) {
      return state;
    }
  }
  return null;
};

export const getCityById = (cityId: string) => {
  return ALL_CITIES.find(city => city.id === cityId);
};

export const searchCities = (query: string) => {
  const lowercaseQuery = query.toLowerCase();
  return ALL_CITIES.filter(city => 
    city.name.toLowerCase().includes(lowercaseQuery) ||
    city.state.toLowerCase().includes(lowercaseQuery)
  );
};

// Distance calculation helper (Haversine formula)
export const calculateDistance = (
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLon = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const getNearbyCities = (
  centerCity: Location, 
  radiusKm: number = 50
) => {
  if (!centerCity.coordinates) return [];
  
  return ALL_CITIES.filter(city => {
    if (!city.coordinates || city.id === centerCity.id) return false;
    const distance = calculateDistance(centerCity.coordinates!, city.coordinates);
    return distance <= radiusKm;
  });
};

export type StateId = typeof NIGERIAN_STATES[number]['id'];
export type CityId = typeof ALL_CITIES[number]['id'];