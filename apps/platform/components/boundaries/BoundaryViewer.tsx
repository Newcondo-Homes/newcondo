// apps/platform/components/boundaries/BoundaryViewer.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Badge } from '@newcondo/ui/components/badge';
import { Button } from '@newcondo/ui/components/button';
import { GoogleMap, Polygon, useJsApiLoader } from '@react-google-maps/api';
import { useState } from 'react';
import { MapPin, CheckCircle, Edit } from 'lucide-react';

interface BoundaryViewerProps {
  propertyId?: string;
  boundaryCoordinates?: {
    lat: number;
    lng: number;
  }[];
  gpsCoordinates?: {
    lat: number;
    lng: number;
  };
  boundaryVerified: boolean;
  boundaryMarkedBy?: string;
  boundaryMarkedAt?: Date;
  onEdit?: () => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

export function BoundaryViewer({
  boundaryCoordinates,
  gpsCoordinates,
  boundaryVerified,
  boundaryMarkedBy,
  boundaryMarkedAt,
  onEdit,
}: BoundaryViewerProps) {
  const [mapType, setMapType] = useState<'satellite' | 'roadmap'>('satellite');

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const center = gpsCoordinates || { lat: 6.5244, lng: 3.3792 };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Property Boundary</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              {boundaryVerified ? (
                <Badge className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                  Unverified
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setMapType(mapType === 'satellite' ? 'roadmap' : 'satellite')
              }
            >
              {mapType === 'satellite' ? 'Road View' : 'Satellite View'}
            </Button>
            {onEdit && (
              <Button onClick={onEdit} size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg overflow-hidden border">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={20}
            mapTypeId={mapType}
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              streetViewControl: true,
              fullscreenControl: true,
            }}
          >
            {gpsCoordinates && (
              <div
                style={{
                  position: 'absolute',
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <MapPin className="h-8 w-8 text-red-500 fill-red-500" />
              </div>
            )}

            {boundaryCoordinates && boundaryCoordinates.length > 0 && (
              <Polygon
                paths={boundaryCoordinates}
                options={{
                  fillColor: boundaryVerified ? '#22c55e' : '#eab308',
                  fillOpacity: 0.3,
                  strokeColor: boundaryVerified ? '#16a34a' : '#ca8a04',
                  strokeOpacity: 1,
                  strokeWeight: 2,
                }}
              />
            )}
          </GoogleMap>
        </div>

        {boundaryMarkedBy && boundaryMarkedAt && (
          <div className="text-sm text-muted-foreground">
            <p>
              Marked by agent on {formatDate(boundaryMarkedAt)}
            </p>
          </div>
        )}

        {!boundaryCoordinates && (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No boundary marked for this property
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}