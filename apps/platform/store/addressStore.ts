// apps/platform/store/addressStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AddressData {
  state: string;
  lga: string;
  location: string;
  fullAddress: string;
}

interface AddressStore {
  // Current selection
  selectedState: string | null;
  selectedLga: string | null;
  selectedLocation: string | null;
  
  // Available options
  states: string[];
  lgas: string[];
  locations: string[];
  
  // Loading states
  isLoadingStates: boolean;
  isLoadingLgas: boolean;
  isLoadingLocations: boolean;
  
  // Error states
  stateError: string | null;
  lgaError: string | null;
  locationError: string | null;
  
  // Saved addresses (for quick selection)
  savedAddresses: AddressData[];
  
  // Actions
  setSelectedState: (state: string | null) => void;
  setSelectedLga: (lga: string | null) => void;
  setSelectedLocation: (location: string | null) => void;
  
  setStates: (states: string[]) => void;
  setLgas: (lgas: string[]) => void;
  setLocations: (locations: string[]) => void;
  
  setLoadingStates: (loading: boolean) => void;
  setLoadingLgas: (loading: boolean) => void;
  setLoadingLocations: (loading: boolean) => void;
  
  setStateError: (error: string | null) => void;
  setLgaError: (error: string | null) => void;
  setLocationError: (error: string | null) => void;
  
  addSavedAddress: (address: AddressData) => void;
  removeSavedAddress: (fullAddress: string) => void;
  
  getFullAddress: () => string;
  getAddressData: () => AddressData | null;
  
  resetSelection: () => void;
  resetLgaSelection: () => void;
  resetLocationSelection: () => void;
  resetAll: () => void;
}

export const useAddressStore = create<AddressStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        selectedState: null,
        selectedLga: null,
        selectedLocation: null,
        
        states: [],
        lgas: [],
        locations: [],
        
        isLoadingStates: false,
        isLoadingLgas: false,
        isLoadingLocations: false,
        
        stateError: null,
        lgaError: null,
        locationError: null,
        
        savedAddresses: [],
        
        // Actions
        setSelectedState: (state) => 
          set({ 
            selectedState: state,
            selectedLga: null,
            selectedLocation: null,
            lgas: [],
            locations: []
          }),
        
        setSelectedLga: (lga) => 
          set({ 
            selectedLga: lga,
            selectedLocation: null,
            locations: []
          }),
        
        setSelectedLocation: (location) => 
          set({ selectedLocation: location }),
        
        setStates: (states) => 
          set({ states }),
        
        setLgas: (lgas) => 
          set({ lgas }),
        
        setLocations: (locations) => 
          set({ locations }),
        
        setLoadingStates: (loading) => 
          set({ isLoadingStates: loading }),
        
        setLoadingLgas: (loading) => 
          set({ isLoadingLgas: loading }),
        
        setLoadingLocations: (loading) => 
          set({ isLoadingLocations: loading }),
        
        setStateError: (error) => 
          set({ stateError: error }),
        
        setLgaError: (error) => 
          set({ lgaError: error }),
        
        setLocationError: (error) => 
          set({ locationError: error }),
        
        addSavedAddress: (address) => {
          const { savedAddresses } = get();
          const exists = savedAddresses.some(
            addr => addr.fullAddress === address.fullAddress
          );
          
          if (!exists) {
            set({ 
              savedAddresses: [...savedAddresses, address].slice(-5) // Keep last 5
            });
          }
        },
        
        removeSavedAddress: (fullAddress) => {
          const { savedAddresses } = get();
          set({ 
            savedAddresses: savedAddresses.filter(
              addr => addr.fullAddress !== fullAddress
            )
          });
        },
        
        getFullAddress: () => {
          const { selectedState, selectedLga, selectedLocation } = get();
          
          if (!selectedState || !selectedLga || !selectedLocation) {
            return '';
          }
          
          return `${selectedLocation}, ${selectedLga}, ${selectedState}, Nigeria`;
        },
        
        getAddressData: () => {
          const { selectedState, selectedLga, selectedLocation } = get();
          
          if (!selectedState || !selectedLga || !selectedLocation) {
            return null;
          }
          
          return {
            state: selectedState,
            lga: selectedLga,
            location: selectedLocation,
            fullAddress: get().getFullAddress()
          };
        },
        
        resetSelection: () => 
          set({ 
            selectedState: null,
            selectedLga: null,
            selectedLocation: null,
            lgas: [],
            locations: []
          }),
        
        resetLgaSelection: () => 
          set({ 
            selectedLga: null,
            selectedLocation: null,
            locations: []
          }),
        
        resetLocationSelection: () => 
          set({ selectedLocation: null }),
        
        resetAll: () => 
          set({
            selectedState: null,
            selectedLga: null,
            selectedLocation: null,
            states: [],
            lgas: [],
            locations: [],
            isLoadingStates: false,
            isLoadingLgas: false,
            isLoadingLocations: false,
            stateError: null,
            lgaError: null,
            locationError: null
          })
      }),
      {
        name: 'address-storage',
        partialize: (state) => ({ 
          savedAddresses: state.savedAddresses 
        })
      }
    ),
    { name: 'AddressStore' }
  )
);