// apps/platform/hooks/useGeolocation.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { geolocationApi, type GeolocationCoordinates } from '@/lib/api/geolocation';

interface GeolocationState {
  coordinates: GeolocationCoordinates | null;
  error: string | null;
  loading: boolean;
  accuracy: number | null;
  timestamp: number | null;
  isSupported: boolean;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
  autoStart?: boolean;
}

interface UseGeolocationReturn extends GeolocationState {
  getCurrentLocation: () => Promise<GeolocationCoordinates>;
  startWatching: () => void;
  stopWatching: () => void;
  refresh: () => void;
  clearError: () => void;
}

export const useGeolocation = (options: GeolocationOptions = {}): UseGeolocationReturn => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000,
    watch = false,
    autoStart = true,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    error: null,
    loading: false,
    accuracy: null,
    timestamp: null,
    isSupported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
  });

  const watchIdRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  const updateState = useCallback((updates: Partial<GeolocationState>) => {
    if (!isMountedRef.current) return;
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    const coordinates: GeolocationCoordinates = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude || undefined,
      altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
    };

    updateState({
      coordinates,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
      loading: false,
      error: null,
    });
  }, [updateState]);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage: string;
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied. Please enable location permissions.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information is unavailable.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out. Please try again.';
        break;
      default:
        errorMessage = 'An unknown error occurred while retrieving location.';
        break;
    }

    updateState({
      error: errorMessage,
      loading: false,
    });
  }, [updateState]);

  const getCurrentLocation = useCallback(async (): Promise<GeolocationCoordinates> => {
    if (!state.isSupported) {
      throw new Error('Geolocation is not supported by this browser.');
    }

    updateState({ loading: true, error: null });

    try {
      const coordinates = await geolocationApi.getCurrentLocation();
      updateState({
        coordinates,
        accuracy: coordinates.accuracy || null,
        timestamp: Date.now(),
        loading: false,
        error: null,
      });
      return coordinates;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get current location';
      updateState({
        error: errorMessage,
        loading: false,
      });
      throw new Error(errorMessage);
    }
  }, [state.isSupported, updateState]);

  const startWatching = useCallback(() => {
    if (!state.isSupported) {
      updateState({ error: 'Geolocation is not supported by this browser.' });
      return;
    }

    if (watchIdRef.current !== null) {
      return; // Already watching
    }

    updateState({ loading: true, error: null });

    try {
      watchIdRef.current = geolocationApi.watchLocation(
        (coordinates) => {
          updateState({
            coordinates,
            accuracy: coordinates.accuracy || null,
            timestamp: Date.now(),
            loading: false,
            error: null,
          });
        },
        (error) => {
          updateState({
            error: error.message,
            loading: false,
          });
        }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start watching location';
      updateState({
        error: errorMessage,
        loading: false,
      });
    }
  }, [state.isSupported, updateState]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      geolocationApi.clearLocationWatch(watchIdRef.current);
      watchIdRef.current = null;
      updateState({ loading: false });
    }
  }, [updateState]);

  const refresh = useCallback(() => {
    if (watchIdRef.current !== null) {
      stopWatching();
      setTimeout(startWatching, 100);
    } else {
      getCurrentLocation().catch(() => {
        // Error already handled in getCurrentLocation
      });
    }
  }, [getCurrentLocation, startWatching, stopWatching]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Auto-start effect
  useEffect(() => {
    if (!autoStart || !state.isSupported) return;

    if (watch) {
      startWatching();
    } else {
      getCurrentLocation().catch(() => {
        // Error already handled in getCurrentLocation
      });
    }

    return () => {
      isMountedRef.current = false;
      stopWatching();
    };
  }, [autoStart, watch, state.isSupported]); // Only depend on these values

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      stopWatching();
    };
  }, [stopWatching]);

  return {
    ...state,
    getCurrentLocation,
    startWatching,
    stopWatching,
    refresh,
    clearError,
  };
};

// Hook for distance calculations
export const useDistanceCalculator = () => {
  const calculateDistance = useCallback((
    point1: GeolocationCoordinates,
    point2: GeolocationCoordinates
  ): number => {
    return geolocationApi.calculateDistance(point1, point2);
  }, []);

  const isWithinRadius = useCallback((
    center: GeolocationCoordinates,
    point: GeolocationCoordinates,
    radiusMeters: number
  ): boolean => {
    const distance = calculateDistance(center, point);
    return distance <= radiusMeters;
  }, [calculateDistance]);

  const findNearestPoint = useCallback((
    reference: GeolocationCoordinates,
    points: GeolocationCoordinates[]
  ): { point: GeolocationCoordinates; distance: number; index: number } | null => {
    if (points.length === 0) return null;

    let nearest = {
      point: points[0],
      distance: calculateDistance(reference, points[0]),
      index: 0,
    };

    for (let i = 1; i < points.length; i++) {
      const distance = calculateDistance(reference, points[i]);
      if (distance < nearest.distance) {
        nearest = {
          point: points[i],
          distance,
          index: i,
        };
      }
    }

    return nearest;
  }, [calculateDistance]);

  const sortByDistance = useCallback((
    reference: GeolocationCoordinates,
    points: GeolocationCoordinates[]
  ): Array<{ point: GeolocationCoordinates; distance: number; index: number }> => {
    return points
      .map((point, index) => ({
        point,
        distance: calculateDistance(reference, point),
        index,
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [calculateDistance]);

  return {
    calculateDistance,
    isWithinRadius,
    findNearestPoint,
    sortByDistance,
  };
};

// Hook for location permissions
export const useLocationPermission = () => {
  const [permissionState, setPermissionState] = useState<{
    state: PermissionState | 'unsupported' | null;
    loading: boolean;
  }>({
    state: null,
    loading: false,
  });

  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) {
      setPermissionState({ state: 'unsupported', loading: false });
      return 'unsupported';
    }

    setPermissionState(prev => ({ ...prev, loading: true }));

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setPermissionState({ state: permission.state, loading: false });
      return permission.state;
    } catch (error) {
      setPermissionState({ state: 'unsupported', loading: false });
      return 'unsupported';
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<GeolocationCoordinates | null> => {
    try {
      const coordinates = await geolocationApi.getCurrentLocation();
      await checkPermission(); // Update permission state
      return coordinates;
    } catch (error) {
      await checkPermission(); // Update permission state even on error
      return null;
    }
  }, [checkPermission]);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    ...permissionState,
    checkPermission,
    requestPermission,
  };
};

export default useGeolocation;