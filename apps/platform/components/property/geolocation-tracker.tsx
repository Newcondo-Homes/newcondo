'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}

interface GeolocationTrackerProps {
  onLocationUpdate: (location: GeolocationData) => void;
  onLocationError: (error: string) => void;
  showAddressLookup?: boolean;
  autoStart?: boolean;
  className?: string;
}

type LocationStatus = 'idle' | 'requesting' | 'success' | 'error' | 'denied';

const GeolocationTracker: React.FC<GeolocationTrackerProps> = ({
  onLocationUpdate,
  onLocationError,
  showAddressLookup = true,
  autoStart = false,
  className = ''
}) => {
  const [location, setLocation] = useState<GeolocationData | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Reverse geocoding to get address from coordinates
  const getAddressFromCoordinates = useCallback(async (lat: number, lng: number): Promise<string | undefined> => {
    if (!showAddressLookup) return undefined;
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      
      return undefined;
    } catch (error) {
      console.error('Error fetching address:', error);
      return undefined;
    }
  }, [showAddressLookup]);

  // Handle successful location retrieval
  const handleLocationSuccess = useCallback(async (position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords;
    const timestamp = Date.now();
    
    let address: string | undefined;
    if (showAddressLookup) {
      address = await getAddressFromCoordinates(latitude, longitude);
    }
    
    const locationData: GeolocationData = {
      latitude,
      longitude,
      accuracy,
      timestamp,
      address
    };
    
    setLocation(locationData);
    setStatus('success');
    setError(null);
    onLocationUpdate(locationData);
  }, [onLocationUpdate, showAddressLookup, getAddressFromCoordinates]);

  // Handle location errors
  const handleLocationError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Failed to get location';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied by user';
        setStatus('denied');
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information is unavailable';
        setStatus('error');
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out';
        setStatus('error');
        break;
      default:
        errorMessage = `Location error: ${error.message}`;
        setStatus('error');
        break;
    }
    
    setError(errorMessage);
    onLocationError(errorMessage);
  }, [onLocationError]);

  // Get current location once
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      const errorMsg = 'Geolocation is not supported by this browser';
      setError(errorMsg);
      setStatus('error');
      onLocationError(errorMsg);
      return;
    }

    setStatus('requesting');
    setError(null);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      handleLocationError,
      options
    );
  }, [handleLocationSuccess, handleLocationError, onLocationError]);

  // Start watching location changes
  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      const errorMsg = 'Geolocation is not supported by this browser';
      setError(errorMsg);
      setStatus('error');
      onLocationError(errorMsg);
      return;
    }

    setStatus('requesting');
    setError(null);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 30000
    };

    const id = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      options
    );

    setWatchId(id);
    setIsWatching(true);
  }, [handleLocationSuccess, handleLocationError, onLocationError]);

  // Stop watching location changes
  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsWatching(false);
    }
  }, [watchId]);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart) {
      getCurrentLocation();
    }
  }, [autoStart, getCurrentLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Get status badge
  const getStatusBadge = () => {
    switch (status) {
      case 'success':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Location Found
          </Badge>
        );
      case 'requesting':
        return (
          <Badge variant="secondary">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Getting Location...
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Location Error
          </Badge>
        );
      case 'denied':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Access Denied
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <MapPin className="w-3 h-3 mr-1" />
            Location Not Set
          </Badge>
        );
    }
  };

  // Format accuracy for display
  const formatAccuracy = (accuracy: number): string => {
    if (accuracy < 1000) {
      return `${Math.round(accuracy)}m`;
    }
    return `${(accuracy / 1000).toFixed(1)}km`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Location Tracking</CardTitle>
            <CardDescription>
              Track your current location for property listing
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Location Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={getCurrentLocation}
            disabled={status === 'requesting'}
            variant="default"
            size="sm"
          >
            {status === 'requesting' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4 mr-2" />
            )}
            Get Current Location
          </Button>
          
          <Button
            onClick={location ? getCurrentLocation : undefined}
            disabled={!location || status === 'requesting'}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          
          {!isWatching ? (
            <Button
              onClick={startWatching}
              disabled={status === 'requesting'}
              variant="outline"
              size="sm"
            >
              Start Watching
            </Button>
          ) : (
            <Button
              onClick={stopWatching}
              variant="outline"
              size="sm"
            >
              Stop Watching
            </Button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Location Information */}
        {location && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Latitude:</span>
                <p className="font-mono">{location.latitude.toFixed(6)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Longitude:</span>
                <p className="font-mono">{location.longitude.toFixed(6)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Accuracy:</span>
                <p>{formatAccuracy(location.accuracy)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Updated:</span>
                <p>{new Date(location.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
            
            {location.address && (
              <div className="text-sm">
                <span className="font-medium text-gray-600">Address:</span>
                <p className="mt-1 text-gray-800">{location.address}</p>
              </div>
            )}
          </div>
        )}

        {/* Location Permission Help */}
        {status === 'denied' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              To use this feature, please enable location access in your browser settings and refresh the page.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default GeolocationTracker;