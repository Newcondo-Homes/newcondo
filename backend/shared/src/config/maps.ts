import { config } from 'dotenv';

config();

interface GoogleMapsConfig {
  apiKey: string;
  defaultCenter: {
    lat: number;
    lng: number;
  };
  defaultZoom: number;
  maxZoom: number;
  minZoom: number;
  styles: google.maps.MapTypeStyle[];
  libraries: string[];
  region: string;
  language: string;
}

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Nigeria's geographical bounds
export const NIGERIA_BOUNDS: MapBounds = {
  north: 13.885645,
  south: 4.277144,
  east: 14.677982,
  west: 2.668432,
};

// Major Nigerian cities with coordinates
export const NIGERIAN_CITIES = {
  LAGOS: { lat: 6.5244, lng: 3.3792 },
  ABUJA: { lat: 9.0765, lng: 7.3986 },
  KANO: { lat: 12.0022, lng: 8.5920 },
  IBADAN: { lat: 7.3775, lng: 3.9470 },
  BENIN_CITY: { lat: 6.3350, lng: 5.6037 },
  PORT_HARCOURT: { lat: 4.8156, lng: 7.0498 },
  KADUNA: { lat: 10.5105, lng: 7.4165 },
  JOS: { lat: 9.9285, lng: 8.8921 },
  ILORIN: { lat: 8.5000, lng: 4.5500 },
  ENUGU: { lat: 6.5244, lng: 7.5086 },
};

// Custom map styles for better property visualization
const customMapStyles: google.maps.MapTypeStyle[] = [
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "transit",
    elementType: "labels",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "road",
    elementType: "labels",
    stylers: [{ visibility: "simplified" }]
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#f5f5f5" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c9c9c9" }]
  },
];

export const googleMapsConfig: GoogleMapsConfig = {
  apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  defaultCenter: NIGERIAN_CITIES.LAGOS, // Default to Lagos
  defaultZoom: 10,
  maxZoom: 22, // Maximum satellite zoom level
  minZoom: 6,
  styles: customMapStyles,
  libraries: ['places', 'geometry', 'drawing'], // Required libraries for boundary marking
  region: 'NG', // Nigeria region code
  language: 'en', // English language
};

// Validation function for Google Maps API key
export const validateMapsConfig = (): boolean => {
  if (!googleMapsConfig.apiKey) {
    console.error('Google Maps API key is required. Please set GOOGLE_MAPS_API_KEY in environment variables.');
    return false;
  }
  
  if (googleMapsConfig.apiKey.length < 30) {
    console.warn('Google Maps API key appears to be invalid or incomplete.');
    return false;
  }
  
  return true;
};

// Map type configurations for property marking
export const MAP_TYPES = {
  ROADMAP: 'roadmap',
  SATELLITE: 'satellite',
  HYBRID: 'hybrid',
  TERRAIN: 'terrain',
} as const;

// Default map type for property marking (satellite for better boundary visualization)
export const DEFAULT_MARKING_MAP_TYPE = MAP_TYPES.SATELLITE;

// Map options for property boundary marking
export const BOUNDARY_MARKING_OPTIONS = {
  zoomControl: true,
  mapTypeControl: true,
  streetViewControl: false,
  fullscreenControl: true,
  gestureHandling: 'greedy',
  clickableIcons: false,
  disableDoubleClickZoom: true, // Prevent interference with drawing
};

// Drawing manager options for property boundary marking
export const DRAWING_MANAGER_OPTIONS = {
  drawingMode: null,
  drawingControl: true,
  drawingControlOptions: {
    position: 9, // TOP_CENTER
    drawingModes: ['rectangle'], // Only allow rectangle drawing for property boundaries
  },
  rectangleOptions: {
    fillColor: '#FF0000',
    fillOpacity: 0.3,
    strokeWeight: 2,
    strokeColor: '#FF0000',
    clickable: false,
    editable: true,
    zIndex: 1,
  },
};

// Existing property boundary overlay options (for showing already marked properties)
export const EXISTING_BOUNDARY_OPTIONS = {
  fillColor: '#808080', // Grey color for existing boundaries
  fillOpacity: 0.5,
  strokeWeight: 2,
  strokeColor: '#696969',
  clickable: false,
  editable: false,
  zIndex: 2, // Higher than new boundaries
};

// Export type definitions for external use
export type { GoogleMapsConfig, MapBounds };
export { customMapStyles as defaultMapStyles };