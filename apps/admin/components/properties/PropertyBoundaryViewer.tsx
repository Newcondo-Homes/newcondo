'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  MapPin,
  Layers,
  AlertCircle,
  Map as MapIcon,
} from 'lucide-react';
import { GoogleMap, Polygon, Marker, useLoadScript } from '@react-google-maps/api';

interface PropertyBoundaryViewerProps {
  boundaryCoordinates?: {
    coordinates: Array<{ lat: number; lng: number }>;
  } | null;
  gpsCoordinates?: string | null;
  boundaryVerified: boolean;
  boundaryMarkedAt?: string | null;
  boundaryMarkedBy?: string | null;
  address: string;
  buildingFingerprint?: string | null;
}

const mapContainerStyle = {
  width: '100%',
  height: '500px',
};

const mapOptions = {
  mapTypeId: 'satellite' as const,
  mapTypeControl: true,
  mapTypeControlOptions: {
    style: 1, // DEFAULT
    position: 3, // TOP_RIGHT
    mapTypeIds: ['roadmap', 'satellite', 'hybrid'],
  },
  streetViewControl: true,
  fullscreenControl: true,
  zoomControl: true,
};

export function PropertyBoundaryViewer({
  boundaryCoordinates,
  gpsCoordinates,
  boundaryVerified,
  boundaryMarkedAt,
  boundaryMarkedBy,
  address,
  buildingFingerprint,
}: PropertyBoundaryViewerProps) {
  const [center, setCenter] = useState({ lat: 6.5244, lng: 3.3792 }); // Default Lagos
  const [mapType, setMapType] = useState<'satellite' | 'roadmap'>('satellite');
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  useEffect(() => {
    if (gpsCoordinates) {
      try {
        const coords = JSON.parse(gpsCoordinates);
        if (coords.lat && coords.lng) {
          setCenter({ lat: coords.lat, lng: coords.lng });
        }
      } catch (error) {
        console.error('Failed to parse GPS coordinates:', error);
      }
    }
  }, [gpsCoordinates]);

  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    
    // If we have boundary coordinates, fit bounds to show the entire boundary
    if (boundaryCoordinates?.coordinates && boundaryCoordinates.coordinates.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      boundaryCoordinates.coordinates.forEach((coord) => {
        bounds.extend(new google.maps.LatLng(coord.lat, coord.lng));
      });
      map.fitBounds(bounds);
    } else if (gpsCoordinates) {
      // Otherwise, zoom to the center point
      map.setZoom(20);
    }
  };

  if (loadError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Property Boundary</CardTitle>
          <CardDescription>Location and boundary information</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load Google Maps. Please check your internet connection or API key.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Property Boundary</CardTitle>
          <CardDescription>Loading map...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[500px] items-center justify-center bg-gray-100">
            <div className="text-center">
              <MapIcon className="mx-auto mb-4 h-12 w-12 animate-pulse text-gray-400" />
              <p className="text-sm text-gray-500">Loading map...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasBoundary = boundaryCoordinates?.coordinates && boundaryCoordinates.coordinates.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Property Boundary</CardTitle>
            <CardDescription>Location and boundary verification details</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {boundaryVerified ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="mr-1 h-3 w-3" />
                Verified
              </Badge>
            ) : (
              <Badge className="bg-yellow-100 text-yellow-800">
                <XCircle className="mr-1 h-3 w-3" />
                Not Verified
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Boundary Status Info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-3">
            <div className="mb-1 flex items-center gap-2 text-gray-500">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">Location</span>
            </div>
            <p className="text-sm text-gray-900">{address}</p>
          </div>

          {buildingFingerprint && (
            <div className="rounded-lg border p-3">
              <div className="mb-1 flex items-center gap-2 text-gray-500">
                <Layers className="h-4 w-4" />
                <span className="text-sm font-medium">Building Fingerprint</span>
              </div>
              <p className="font-mono text-xs text-gray-600">{buildingFingerprint}</p>
            </div>
          )}

          {boundaryMarkedAt && (
            <div className="rounded-lg border p-3">
              <div className="mb-1 flex items-center gap-2 text-gray-500">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Marked At</span>
              </div>
              <p className="text-sm text-gray-900">
                {new Date(boundaryMarkedAt).toLocaleString()}
              </p>
            </div>
          )}

          {boundaryMarkedBy && (
            <div className="rounded-lg border p-3">
              <div className="mb-1 flex items-center gap-2 text-gray-500">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Marked By</span>
              </div>
              <p className="text-sm text-gray-900">Agent ID: {boundaryMarkedBy}</p>
            </div>
          )}
        </div>

        {/* Warning if no boundary */}
        {!hasBoundary && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This property does not have a marked boundary. Property approval requires boundary
              verification.
            </AlertDescription>
          </Alert>
        )}

        {/* Map View Controls */}
        <div className="flex gap-2">
          <Button
            variant={mapType === 'satellite' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMapType('satellite')}
          >
            Satellite
          </Button>
          <Button
            variant={mapType === 'roadmap' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMapType('roadmap')}
          >
            Map
          </Button>
        </div>

        {/* Google Map */}
        <div className="overflow-hidden rounded-lg border">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={18}
            options={{ ...mapOptions, mapTypeId: mapType }}
            onLoad={onMapLoad}
          >
            {/* Center Marker */}
            {gpsCoordinates && (
              <Marker
                position={center}
                title="Property Location"
                icon={{
                  url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                }}
              />
            )}

            {/* Boundary Polygon */}
            {hasBoundary && (
              <Polygon
                paths={boundaryCoordinates.coordinates}
                options={{
                  fillColor: boundaryVerified ? '#22c55e' : '#eab308',
                  fillOpacity: 0.35,
                  strokeColor: boundaryVerified ? '#16a34a' : '#ca8a04',
                  strokeOpacity: 1,
                  strokeWeight: 3,
                  clickable: false,
                  draggable: false,
                  editable: false,
                  geodesic: false,
                  zIndex: 1,
                }}
              />
            )}
          </GoogleMap>
        </div>

        {/* Coordinate Information */}
        {gpsCoordinates && (
          <div className="rounded-lg bg-gray-50 p-3">
            <h4 className="mb-2 text-sm font-medium text-gray-700">GPS Coordinates</h4>
            <pre className="text-xs text-gray-600">{gpsCoordinates}</pre>
          </div>
        )}

        {hasBoundary && (
          <div className="rounded-lg bg-gray-50 p-3">
            <h4 className="mb-2 text-sm font-medium text-gray-700">
              Boundary Coordinates ({boundaryCoordinates.coordinates.length} points)
            </h4>
            <div className="max-h-40 overflow-y-auto">
              <pre className="text-xs text-gray-600">
                {JSON.stringify(boundaryCoordinates, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Verification Instructions */}
        {!boundaryVerified && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Verification Checklist:</strong>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                <li>Verify the boundary accurately covers the property</li>
                <li>Check for overlaps with existing properties</li>
                <li>Ensure the location matches the provided address</li>
                <li>Confirm with satellite and street view if available</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}