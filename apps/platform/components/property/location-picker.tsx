"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Search, Target, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationData {
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  country: string;
  placeId?: string;
}

interface LocationPickerProps {
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: LocationData;
  disabled?: boolean;
  showCurrentLocation?: boolean;
  className?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 6.5244, // Lagos, Nigeria
  lng: 3.3792
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: true,
  mapTypeControl: true,
  fullscreenControl: true,
  gestureHandling: 'greedy' as const,
  mapTypeId: 'satellite' as const, // Default to satellite view for boundary marking
  minZoom: 10,
  maxZoom: 22,
};

export default function LocationPicker({
  onLocationSelect,
  initialLocation,
  disabled = false,
  showCurrentLocation = true,
  className
}: LocationPickerProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places', 'geometry']
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(initialLocation || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showInfoWindow, setShowInfoWindow] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number; lng: number} | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Initialize autocomplete
  useEffect(() => {
    if (isLoaded && searchInputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = new google.maps.places.Autocomplete(searchInputRef.current, {
        componentRestrictions: { country: 'ng' }, // Restrict to Nigeria
        fields: ['place_id', 'geometry', 'name', 'formatted_address', 'address_components'],
        types: ['establishment', 'geocode']
      });

      autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
    }
  }, [isLoaded]);

  const handlePlaceSelect = useCallback(() => {
    if (!autocompleteRef.current) return;

    const place = autocompleteRef.current.getPlace();
    
    if (!place.geometry?.location) {
      setError('Please select a valid location');
      return;
    }

    const location = extractLocationData(place);
    setSelectedLocation(location);
    setShowInfoWindow(true);
    setError(null);
    
    // Center map on selected location
    if (map) {
      map.panTo(place.geometry.location);
      map.setZoom(18); // Zoom in for detailed view
    }
  }, [map]);

  const extractLocationData = (place: google.maps.places.PlaceResult): LocationData => {
    const location: LocationData = {
      lat: place.geometry!.location!.lat(),
      lng: place.geometry!.location!.lng(),
      address: place.formatted_address || '',
      city: '',
      state: '',
      country: 'Nigeria',
      placeId: place.place_id
    };

    // Extract city and state from address components
    place.address_components?.forEach((component) => {
      if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
        location.city = component.long_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        location.state = component.long_name;
      }
    });

    return location;
  };

  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (disabled || !event.latLng) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    // Reverse geocode to get address
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = extractLocationData(results[0]);
        setSelectedLocation(location);
        setShowInfoWindow(true);
        setError(null);
      } else {
        // Fallback location data
        const location: LocationData = {
          lat,
          lng,
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          city: '',
          state: '',
          country: 'Nigeria'
        };
        setSelectedLocation(location);
        setShowInfoWindow(true);
        setError(null);
      }
    });
  }, [disabled]);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsGettingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };
        
        setCurrentLocation(location);
        
        // Center map on current location
        if (map) {
          map.panTo(location);
          map.setZoom(18);
        }

        // Reverse geocode current location
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const locationData = extractLocationData(results[0]);
            setSelectedLocation(locationData);
            setShowInfoWindow(true);
          }
        });

        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('Location access denied. Please enable location permissions.');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setError('Location request timed out.');
            break;
          default:
            setError('An error occurred while retrieving location.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [map]);

  const handleConfirmLocation = useCallback(() => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      setShowInfoWindow(false);
    }
  }, [selectedLocation, onLocationSelect]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onMapUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (loadError) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-700">
          Failed to load Google Maps. Please check your internet connection and try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!isLoaded) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-sm text-gray-600">Loading map...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Select Property Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="space-y-2">
          <Label htmlFor="location-search">Search for an address or place</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              ref={searchInputRef}
              id="location-search"
              placeholder="e.g., Victoria Island, Lagos"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={disabled || isSearching}
              className="pl-10"
            />
          </div>
        </div>

        {/* Current Location Button */}
        {showCurrentLocation && (
          <Button
            type="button"
            variant="outline"
            onClick={getCurrentLocation}
            disabled={disabled || isGettingLocation}
            className="w-full"
          >
            <Target className="h-4 w-4 mr-2" />
            {isGettingLocation ? 'Getting location...' : 'Use Current Location'}
          </Button>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Map */}
        <div className="relative rounded-lg overflow-hidden border">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={selectedLocation || currentLocation || defaultCenter}
            zoom={selectedLocation ? 18 : 11}
            onLoad={onMapLoad}
            onUnmount={onMapUnmount}
            onClick={handleMapClick}
            options={mapOptions}
          >
            {/* Selected Location Marker */}
            {selectedLocation && (
              <Marker
                position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                onClick={() => setShowInfoWindow(true)}
                icon={{
                  url: '/images/icons/property-marker.png',
                  scaledSize: new window.google.maps.Size(32, 32),
                  origin: new window.google.maps.Point(0, 0),
                  anchor: new window.google.maps.Point(16, 32)
                }}
              />
            )}

            {/* Current Location Marker */}
            {currentLocation && (
              <Marker
                position={currentLocation}
                icon={{
                  url: '/images/icons/current-location.png',
                  scaledSize: new window.google.maps.Size(20, 20),
                  origin: new window.google.maps.Point(0, 0),
                  anchor: new window.google.maps.Point(10, 10)
                }}
              />
            )}

            {/* Info Window */}
            {showInfoWindow && selectedLocation && (
              <InfoWindow
                position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                onCloseClick={() => setShowInfoWindow(false)}
              >
                <div className="p-2 max-w-xs">
                  <h3 className="font-semibold text-sm mb-2">Selected Location</h3>
                  <p className="text-xs text-gray-600 mb-3">{selectedLocation.address}</p>
                  <div className="text-xs text-gray-500 mb-3">
                    <p>Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</p>
                    {selectedLocation.city && <p>City: {selectedLocation.city}</p>}
                    {selectedLocation.state && <p>State: {selectedLocation.state}</p>}
                  </div>
                  <Button
                    size="sm"
                    onClick={handleConfirmLocation}
                    className="w-full"
                  >
                    Confirm Location
                  </Button>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>

        {/* Instructions */}
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Search for your property address or click on the map to select a location</p>
          <p>• Use satellite view to get a better view of the property</p>
          <p>• Click "Confirm Location" to proceed with boundary marking</p>
        </div>
      </CardContent>
    </Card>
  );
}