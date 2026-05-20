// backend/shared/src/constants/nigeriaAddress.ts

export interface AddressLocation {
  name: string;
  code: string;
}

export interface LGA extends AddressLocation {
  locations: string[];
}

interface NigerianState extends AddressLocation {
  lgas: LGA[];
}

/**
 * Comprehensive Nigerian Address Hierarchy
 * State -> LGA (Local Government Area) -> Locations (Towns/Areas)
 */
export const NIGERIAN_STATES: NigerianState[] = [
  {
    name: "Lagos",
    code: "LA",
    lgas: [
      {
        name: "Ikeja",
        code: "IKJ",
        locations: [
          "Alausa",
          "Oregun",
          "Allen Avenue",
          "Opebi",
          "Omole Phase 1",
          "Omole Phase 2",
          "Agidingbi",
          "Ojodu",
          "Berger",
          "Computer Village"
        ]
      },
      {
        name: "Lagos Island",
        code: "LGI",
        locations: [
          "Victoria Island",
          "Ikoyi",
          "Lekki Phase 1",
          "Lekki Phase 2",
          "Oniru",
          "Banana Island",
          "Marina",
          "Broad Street",
          "Ajah",
          "Eti-Osa"
        ]
      },
      {
        name: "Surulere",
        code: "SUR",
        locations: [
          "Ojuelegba",
          "Shitta",
          "Adeniran Ogunsanya",
          "Aguda",
          "Ijeshatedo",
          "Iponri",
          "Itire",
          "Lawanson"
        ]
      },
      {
        name: "Alimosho",
        code: "ALM",
        locations: [
          "Egbeda",
          "Idimu",
          "Ikotun",
          "Akowonjo",
          "Dopemu",
          "Pleasure",
          "Iyana-Ipaja",
          "Igando",
          "Isheri Olofin"
        ]
      },
      {
        name: "Oshodi-Isolo",
        code: "OSH",
        locations: [
          "Oshodi",
          "Isolo",
          "Mafoluku",
          "Ajao Estate",
          "Airport Road",
          "Okota",
          "Ejigbo"
        ]
      }
    ]
  },
  {
    name: "Abuja (FCT)",
    code: "FC",
    lgas: [
      {
        name: "Abuja Municipal Area Council",
        code: "AMAC",
        locations: [
          "Asokoro",
          "Maitama",
          "Wuse",
          "Garki",
          "Central Business District",
          "Apo",
          "Gudu",
          "Jabi",
          "Utako",
          "Gwarinpa"
        ]
      },
      {
        name: "Gwagwalada",
        code: "GWG",
        locations: [
          "Gwagwalada Town",
          "Phase 1",
          "Phase 2",
          "Phase 3",
          "Tungan Maje",
          "Paikon Kore"
        ]
      },
      {
        name: "Kuje",
        code: "KUJ",
        locations: [
          "Kuje Town",
          "Rubochi",
          "Chibiri",
          "Gudunkarya"
        ]
      }
    ]
  },
  {
    name: "Rivers",
    code: "RI",
    lgas: [
      {
        name: "Port Harcourt",
        code: "PHC",
        locations: [
          "Old GRA",
          "New GRA",
          "Trans Amadi",
          "Diobu",
          "Rumuola",
          "Rumuokwuta",
          "Rumuokoro",
          "Eliozu",
          "Choba"
        ]
      },
      {
        name: "Obio-Akpor",
        code: "OBA",
        locations: [
          "Rumuodara",
          "Rumueme",
          "Rumuokoro",
          "Artillery",
          "Elelenwo",
          "Ozuoba"
        ]
      }
    ]
  },
  {
    name: "Oyo",
    code: "OY",
    lgas: [
      {
        name: "Ibadan North",
        code: "IBN",
        locations: [
          "Bodija",
          "Agodi",
          "Mokola",
          "Sango",
          "Oke-Ado",
          "Ikolaba"
        ]
      },
      {
        name: "Ibadan South-West",
        code: "IBSW",
        locations: [
          "Ring Road",
          "Idi-Ape",
          "Oke-Bola",
          "Molete",
          "Oke-Foko"
        ]
      }
    ]
  },
  {
    name: "Kano",
    code: "KN",
    lgas: [
      {
        name: "Kano Municipal",
        code: "KNM",
        locations: [
          "Sabon Gari",
          "Fagge",
          "Gwale",
          "Kano City",
          "Nassarawa",
          "Dala"
        ]
      },
      {
        name: "Nassarawa",
        code: "NSS",
        locations: [
          "Nassarawa GRA",
          "Zoo Road",
          "Brigade"
        ]
      }
    ]
  },
  {
    name: "Ogun",
    code: "OG",
    lgas: [
      {
        name: "Abeokuta South",
        code: "ABS",
        locations: [
          "Oke-Ilewo",
          "Ijaye",
          "Iberekodo",
          "Kobape",
          "Oke-Sokori"
        ]
      },
      {
        name: "Ado-Odo/Ota",
        code: "ADO",
        locations: [
          "Ota",
          "Sango-Ota",
          "Ifo",
          "Ijoko",
          "Agbara",
          "Ado-Odo"
        ]
      }
    ]
  },
  {
    name: "Kaduna",
    code: "KD",
    lgas: [
      {
        name: "Kaduna North",
        code: "KDN",
        locations: [
          "Sabon Tasha",
          "Barnawa",
          "Tudun Wada",
          "Malali",
          "Ungwan Rimi"
        ]
      },
      {
        name: "Kaduna South",
        code: "KDS",
        locations: [
          "Kakuri",
          "Ungwan Sarki",
          "Television",
          "Narayi"
        ]
      }
    ]
  },
  {
    name: "Anambra",
    code: "AN",
    lgas: [
      {
        name: "Awka South",
        code: "AWS",
        locations: [
          "Awka",
          "Nibo",
          "Nise",
          "Amawbia",
          "Okpuno"
        ]
      },
      {
        name: "Onitsha North",
        code: "ONT",
        locations: [
          "Onitsha Main Market",
          "Inland Town",
          "Fegge",
          "GRA Onitsha",
          "Woliwo"
        ]
      }
    ]
  },
  {
    name: "Enugu",
    code: "EN",
    lgas: [
      {
        name: "Enugu North",
        code: "ENN",
        locations: [
          "Trans-Ekulu",
          "Abakpa Nike",
          "New Haven",
          "Ogui",
          "GRA Enugu"
        ]
      },
      {
        name: "Enugu South",
        code: "ENS",
        locations: [
          "Independence Layout",
          "Achara Layout",
          "Ugwuaji",
          "Maryland"
        ]
      }
    ]
  },
  {
    name: "Delta",
    code: "DE",
    lgas: [
      {
        name: "Warri South",
        code: "WRS",
        locations: [
          "Warri Township",
          "Effurun",
          "Ekpan",
          "PTI Road",
          "Airport Road"
        ]
      },
      {
        name: "Oshimili South",
        code: "OSM",
        locations: [
          "Asaba",
          "Cable Point",
          "Okpanam",
          "Summit Road",
          "DLA Road"
        ]
      }
    ]
  }
];

/**
 * Get all state names
 */
export const getStateNames = (): string[] => {
  return NIGERIAN_STATES.map(state => state.name);
};

/**
 * Get LGAs for a specific state
 */
export const getLGAsByState = (stateName: string): LGA[] => {
  const state = NIGERIAN_STATES.find(s => s.name === stateName);
  return state?.lgas || [];
};

/**
 * Get locations for a specific LGA in a state
 */
export const getLocationsByLGA = (stateName: string, lgaName: string): string[] => {
  const state = NIGERIAN_STATES.find(s => s.name === stateName);
  const lga = state?.lgas.find(l => l.name === lgaName);
  return lga?.locations || [];
};

/**
 * Validate if a complete address exists
 */
export const isValidAddress = (
  stateName: string,
  lgaName: string,
  location: string
): boolean => {
  const state = NIGERIAN_STATES.find(s => s.name === stateName);
  if (!state) return false;

  const lga = state.lgas.find(l => l.name === lgaName);
  if (!lga) return false;

  return lga.locations.includes(location);
};

/**
 * Get full address path
 */
export const getAddressPath = (
  stateName: string,
  lgaName: string,
  location: string
): string => {
  return `${location}, ${lgaName}, ${stateName}`;
};

/**
 * Search for locations across all states
 */
export const searchLocations = (query: string): Array<{
  state: string;
  lga: string;
  location: string;
}> => {
  const results: Array<{
    state: string;
    lga: string;
    location: string;
  }> = [];

  const lowerQuery = query.toLowerCase();

  NIGERIAN_STATES.forEach(state => {
    state.lgas.forEach(lga => {
      lga.locations.forEach(location => {
        if (location.toLowerCase().includes(lowerQuery)) {
          results.push({
            state: state.name,
            lga: lga.name,
            location
          });
        }
      });
    });
  });

  return results;
};