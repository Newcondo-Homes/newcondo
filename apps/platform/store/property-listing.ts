// packages/platform/src/store/property-listing.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface PropertyBoundary {
  id: string;
  coordinates: google.maps.LatLngLiteral[];
  center: google.maps.LatLngLiteral;
  address: string;
  buildingFingerprint: string;
  isVerified: boolean;
  markedBy: string;
  markedAt: Date;
}

export interface PropertyListingFormData {
  title: string;
  description: string;
  price: number;
  currency: string;
  propertyType: string;
  structure: 'SINGLE_UNIT' | 'MULTI_FAMILY';
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  features: string[];
  buildingFeatures: string[];
  totalUnits?: number;
  availableUnits?: number;
  address: string;
  city: string;
  state: string;
  country: string;
  gpsCoordinates?: string;
  boundaryCoordinates?: google.maps.LatLngLiteral[];
  buildingFingerprint?: string;
  isOwnerListing: boolean;
  availableFrom?: Date;
  images: File[];
  units?: PropertyUnit[];
}

export interface PropertyUnit {
  unitNumber: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  features: string[];
  price: number;
  currency: string;
  availableFrom?: Date;
  images: File[];
}

interface PropertyListingStore {
  // Form state
  formData: PropertyListingFormData;
  currentStep: number;
  isSubmitting: boolean;
  errors: Record<string, string>;
  
  // Boundary marking state
  isMarkingMode: boolean;
  selectedBoundary: PropertyBoundary | null;
  conflictingBoundaries: PropertyBoundary[];
  userLocation: google.maps.LatLngLiteral | null;
  mapCenter: google.maps.LatLngLiteral | null;
  isLocationLoading: boolean;
  
  // Duplicate detection state
  duplicateProperties: PropertyBoundary[];
  isDuplicateCheckLoading: boolean;
  
  // Property marking service state
  showMarkingService: boolean;
  markingServiceType: 'ASSIGN_TO_KNOWN_PERSON' | 'ASSIGN_TO_AGENT' | null;
  markingServiceData: {
    contactPersonName: string;
    contactPersonPhone: string;
    accessInstructions: string;
    preferredTime?: Date;
    urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  };
  
  // Actions
  updateFormData: (data: Partial<PropertyListingFormData>) => void;
  setCurrentStep: (step: number) => void;
  setError: (field: string, message: string) => void;
  clearError: (field: string) => void;
  clearAllErrors: () => void;
  
  // Boundary marking actions
  setMarkingMode: (isMarking: boolean) => void;
  setSelectedBoundary: (boundary: PropertyBoundary | null) => void;
  setUserLocation: (location: google.maps.LatLngLiteral | null) => void;
  setMapCenter: (center: google.maps.LatLngLiteral | null) => void;
  setLocationLoading: (loading: boolean) => void;
  
  // Duplicate detection actions
  checkForDuplicates: (coordinates: google.maps.LatLngLiteral[]) => Promise<void>;
  setDuplicateProperties: (properties: PropertyBoundary[]) => void;
  
  // Property marking service actions
  setShowMarkingService: (show: boolean) => void;
  setMarkingServiceType: (type: 'ASSIGN_TO_KNOWN_PERSON' | 'ASSIGN_TO_AGENT' | null) => void;
  updateMarkingServiceData: (data: Partial<PropertyListingStore['markingServiceData']>) => void;
  
  // Utility actions
  resetForm: () => void;
  submitListing: () => Promise<void>;
}

const initialFormData: PropertyListingFormData = {
  title: '',
  description: '',
  price: 0,
  currency: 'NGN',
  propertyType: 'APARTMENT',
  structure: 'SINGLE_UNIT',
  features: [],
  buildingFeatures: [],
  address: '',
  city: '',
  state: '',
  country: 'Nigeria',
  isOwnerListing: true,
  images: [],
  units: [],
};

const initialMarkingServiceData = {
  contactPersonName: '',
  contactPersonPhone: '',
  accessInstructions: '',
  urgencyLevel: 'NORMAL' as const,
};

export const usePropertyListingStore = create<PropertyListingStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      formData: initialFormData,
      currentStep: 1,
      isSubmitting: false,
      errors: {},
      
      isMarkingMode: false,
      selectedBoundary: null,
      conflictingBoundaries: [],
      userLocation: null,
      mapCenter: null,
      isLocationLoading: false,
      
      duplicateProperties: [],
      isDuplicateCheckLoading: false,
      
      showMarkingService: false,
      markingServiceType: null,
      markingServiceData: initialMarkingServiceData,
      
      // Actions
      updateFormData: (data) => {
        set((state) => ({
          formData: { ...state.formData, ...data },
        }));
      },
      
      setCurrentStep: (step) => {
        set({ currentStep: step });
      },
      
      setError: (field, message) => {
        set((state) => ({
          errors: { ...state.errors, [field]: message },
        }));
      },
      
      clearError: (field) => {
        set((state) => {
          const newErrors = { ...state.errors };
          delete newErrors[field];
          return { errors: newErrors };
        });
      },
      
      clearAllErrors: () => {
        set({ errors: {} });
      },
      
      setMarkingMode: (isMarking) => {
        set({ isMarkingMode: isMarking });
      },
      
      setSelectedBoundary: (boundary) => {
        set({ selectedBoundary: boundary });
      },
      
      setUserLocation: (location) => {
        set({ userLocation: location });
      },
      
      setMapCenter: (center) => {
        set({ mapCenter: center });
      },
      
      setLocationLoading: (loading) => {
        set({ isLocationLoading: loading });
      },
      
      checkForDuplicates: async (coordinates) => {
        set({ isDuplicateCheckLoading: true });
        
        try {
          // API call to check for duplicates
          const response = await fetch('/api/properties/check-duplicates', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ coordinates }),
          });
          
          const data = await response.json();
          
          if (data.success) {
            set({ duplicateProperties: data.duplicates });
          }
        } catch (error) {
          console.error('Error checking for duplicates:', error);
        } finally {
          set({ isDuplicateCheckLoading: false });
        }
      },
      
      setDuplicateProperties: (properties) => {
        set({ duplicateProperties: properties });
      },
      
      setShowMarkingService: (show) => {
        set({ showMarkingService: show });
      },
      
      setMarkingServiceType: (type) => {
        set({ markingServiceType: type });
      },
      
      updateMarkingServiceData: (data) => {
        set((state) => ({
          markingServiceData: { ...state.markingServiceData, ...data },
        }));
      },
      
      resetForm: () => {
        set({
          formData: initialFormData,
          currentStep: 1,
          isSubmitting: false,
          errors: {},
          selectedBoundary: null,
          conflictingBoundaries: [],
          duplicateProperties: [],
          showMarkingService: false,
          markingServiceType: null,
          markingServiceData: initialMarkingServiceData,
        });
      },
      
      submitListing: async () => {
        const { formData } = get();
        set({ isSubmitting: true });
        
        try {
          // Validate form data
          const errors: Record<string, string> = {};
          
          if (!formData.title.trim()) {
            errors.title = 'Property title is required';
          }
          
          if (!formData.description.trim()) {
            errors.description = 'Property description is required';
          }
          
          if (formData.price <= 0) {
            errors.price = 'Property price must be greater than 0';
          }
          
          if (!formData.address.trim()) {
            errors.address = 'Property address is required';
          }
          
          if (!formData.city.trim()) {
            errors.city = 'City is required';
          }
          
          if (!formData.state.trim()) {
            errors.state = 'State is required';
          }
          
          if (formData.images.length === 0) {
            errors.images = 'At least one property image is required';
          }
          
          if (!formData.boundaryCoordinates || formData.boundaryCoordinates.length === 0) {
            errors.boundary = 'Property boundary marking is required';
          }
          
          if (Object.keys(errors).length > 0) {
            set({ errors });
            return;
          }
          
          // Create FormData for file uploads
          const submitData = new FormData();
          
          // Add form fields
          Object.entries(formData).forEach(([key, value]) => {
            if (key === 'images') {
              value.forEach((file: File, index: number) => {
                submitData.append(`images[${index}]`, file);
              });
            } else if (key === 'features' || key === 'buildingFeatures') {
              submitData.append(key, JSON.stringify(value));
            } else if (key === 'boundaryCoordinates') {
              submitData.append(key, JSON.stringify(value));
            } else if (key === 'units' && value && value.length > 0) {
              submitData.append(key, JSON.stringify(value));
            } else if (value !== null && value !== undefined) {
              submitData.append(key, value.toString());
            }
          });
          
          // Submit to API
          const response = await fetch('/api/properties', {
            method: 'POST',
            body: submitData,
          });
          
          const result = await response.json();
          
          if (result.success) {
            // Reset form and redirect
            get().resetForm();
            window.location.href = '/dashboard/properties';
          } else {
            set({ errors: result.errors || { general: 'Failed to create property listing' } });
          }
        } catch (error) {
          console.error('Error submitting listing:', error);
          set({ errors: { general: 'An error occurred while submitting the listing' } });
        } finally {
          set({ isSubmitting: false });
        }
      },
    }),
    {
      name: 'property-listing-store',
    }
  )
);