'use client';
// apps/platform/components/properties/PropertyMap.tsx

import { useJsApiLoader, GoogleMap, Polygon, Marker } from '@react-google-maps/api';
import { AlertTriangle, MapPin } from 'lucide-react';

interface PropertyMapProps {
  property: {
    gpsCoordinates?: string | null;
    boundaryCoordinates?: any;
    boundaryVerified?: boolean;
    title: string;
    address: string;
  };
  showBoundaries?: boolean;
  className?: string;
}

const LIBRARIES: ('geometry')[] = ['geometry'];

export function PropertyMap({
  property,
  showBoundaries = true,
  className = 'h-96',
}: PropertyMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    libraries: LIBRARIES,
  });

  // Parse GPS centre
  const centre = (() => {
    try {
      if (property.gpsCoordinates) {
        const parsed = JSON.parse(property.gpsCoordinates);
        if (parsed?.lat && parsed?.lng) return parsed as { lat: number; lng: number };
      }
    } catch { /* fall through */ }
    return { lat: 6.5244, lng: 3.3792 }; // Lagos fallback
  })();

  // Parse boundary polygon
  const boundaryPath = (() => {
    try {
      const raw = property.boundaryCoordinates;
      if (!raw) return null;
      const ring: number[][] = raw?.coordinates?.[0] ?? [];
      return ring.map(([lng, lat]: number[]) => ({ lat, lng }));
    } catch {
      return null;
    }
  })();

  if (loadError) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-gray-100 text-red-500 ${className}`}>
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
          <p className="text-sm">Failed to load map</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`animate-pulse rounded-xl bg-gray-200 ${className}`} />
    );
  }

  return (
    <div className={`overflow-hidden rounded-xl border border-gray-200 ${className}`}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={centre}
        zoom={17}
        mapTypeId="satellite"
        options={{
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
        }}
      >
        {/* Property pin */}
        <Marker
          position={centre}
          title={property.title}
        />

        {/* Boundary polygon */}
        {showBoundaries && boundaryPath && boundaryPath.length >= 3 && (
          <Polygon
            paths={boundaryPath}
            options={{
              fillColor: property.boundaryVerified ? '#10b981' : '#f59e0b',
              fillOpacity: 0.2,
              strokeColor: property.boundaryVerified ? '#059669' : '#d97706',
              strokeWeight: 2,
              clickable: false,
              editable: false,
              draggable: false,
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
}