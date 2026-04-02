// apps/platform/components/boundaries/BoundaryMap.tsx
'use client';

import { GoogleMap, Polygon, Marker, useJsApiLoader } from '@react-google-maps/api';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { AlertCircle } from 'lucide-react';

interface PropertyBoundary {
  propertyId: string;
  coordinates: { lat: number; lng: number }[];
  title: string;
  isVerified: boolean;
  isDuplicate?: boolean;
}

interface BoundaryMapProps {
  center: { lat: number; lng: number };
  properties: PropertyBoundary[];
  zoom?: number;
  height?: string;
  onPropertyClick?: (propertyId: string) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '600px',
};

export function BoundaryMap({
  center,
  properties,
  zoom = 15,
  height = '600px',
  onPropertyClick,
}: BoundaryMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const getPolygonColor = (property: PropertyBoundary) => {
    if (property.isDuplicate) {
      return {
        fillColor: '#ef4444',
        fillOpacity: 0.4,
        strokeColor: '#dc2626',
      };
    }
    if (property.isVerified) {
      return {
        fillColor: '#22c55e',
        fillOpacity: 0.3,
        strokeColor: '#16a34a',
      };
    }
    return {
      fillColor: '#eab308',
      fillOpacity: 0.3,
      strokeColor: '#ca8a04',
    };
  };

  if (!isLoaded) {
    return (
      <div
        className="flex items-center justify-center bg-muted rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  const hasDuplicates = properties.some((p) => p.isDuplicate);

  return (
    <div className="space-y-4">
      {hasDuplicates && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Duplicate properties detected on the map. These are shown with red
            overlays.
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg overflow-hidden border">
        <GoogleMap
          mapContainerStyle={{ ...mapContainerStyle, height }}
          center={center}
          zoom={zoom}
          mapTypeId="satellite"
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: true,
            fullscreenControl: true,
          }}
        >
          {properties.map((property) => (
            <Polygon
              key={property.propertyId}
              paths={property.coordinates}
              options={{
                ...getPolygonColor(property),
                strokeOpacity: 1,
                strokeWeight: 2,
                clickable: true,
              }}
              onClick={() => onPropertyClick?.(property.propertyId)}
            />
          ))}

          {/* Add markers for property centers */}
          {properties.map((property) => {
            const centerLat =
              property.coordinates.reduce((sum, coord) => sum + coord.lat, 0) /
              property.coordinates.length;
            const centerLng =
              property.coordinates.reduce((sum, coord) => sum + coord.lng, 0) /
              property.coordinates.length;

            return (
              <Marker
                key={`marker-${property.propertyId}`}
                position={{ lat: centerLat, lng: centerLng }}
                title={property.title}
                onClick={() => onPropertyClick?.(property.propertyId)}
              />
            );
          })}
        </GoogleMap>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded border border-green-600"></div>
          <span>Verified</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded border border-yellow-600"></div>
          <span>Unverified</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded border border-red-600"></div>
          <span>Duplicate</span>
        </div>
      </div>
    </div>
  );
}