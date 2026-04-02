'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Polygon, Marker, InfoWindow } from '@react-google-maps/api';
import { MapPin, Verified, AlertTriangle, Info, Maximize2 } from 'lucide-react';
import { Button } from '@newcondo/ui/components/button';
import { Badge } from '@newcondo/ui/components/badge';
import { Card, CardContent } from '@newcondo/ui/components/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@newcondo/ui/components/dialog';
import { cn } from '@newcondo/ui/';

interface PropertyBoundaryMapProps {
  propertyId: string;
  gpsCoordinates?: string; // JSON string: {"lat": 6.5244, "lng": 3.3792}
  boundaryCoordinates?: any; // Polygon coordinates for property boundaries
  boundaryVerified?: boolean;
  boundaryMarkedBy?: string;
  boundaryMarkedAt?: Date | string;
  boundaryImages?: string[];
  className?: string;
  height?: string;
  showFullscreenOption?: boolean;
  showBoundaryInfo?: boolean;
  interactive?: boolean;
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface BoundaryPoint extends Coordinates {
  id: string;
}

const libraries: ("places" | "geometry" | "drawing")[] = ["places", "geometry"];

const PropertyBoundaryMap: React.FC<PropertyBoundaryMapProps> = ({
  propertyId,
  gpsCoordinates,
  boundaryCoordinates,
  boundaryVerified = false,
  boundaryMarkedBy,
  boundaryMarkedAt,
  boundaryImages = [],
  className = '',
  height = '300px',
  showFullscreenOption = true,
  showBoundaryInfo = true,
  interactive = true
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState<Coordinates>({ lat: 6.5244, lng: 3.3792 }); // Default to Lagos
  const [boundaryPath, setBoundaryPath] = useState<Coordinates[]>([]);
  const [showInfoWindow, setShowInfoWindow] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  // Parse GPS coordinates
  useEffect(() => {
    if (gpsCoordinates) {
      try {
        const coords = JSON.parse(gpsCoordinates);
        if (coords.lat && coords.lng) {
          setCenter({ lat: coords.lat, lng: coords.lng });
        }
      } catch (error) {
        console.error('Invalid GPS coordinates format:', error);
      }
    }
  }, [gpsCoordinates]);

  // Parse boundary coordinates
  useEffect(() => {
    if (boundaryCoordinates) {
      try {
        let coords: Coordinates[] = [];
        
        if (Array.isArray(boundaryCoordinates)) {
          // Handle array of coordinate objects
          coords = boundaryCoordinates.map((coord: any) => ({
            lat: coord.lat || coord.latitude,
            lng: coord.lng || coord.longitude
          }));
        } else if (boundaryCoordinates.coordinates) {
          // Handle GeoJSON-like structure
          coords = boundaryCoordinates.coordinates[0].map((coord: [number, number]) => ({
            lat: coord[1], // GeoJSON uses [lng, lat]
            lng: coord[0]
          }));
        } else {
          // Handle other formats
          coords = Object.values(boundaryCoordinates) as Coordinates[];
        }
        
        setBoundaryPath(coords.filter(coord => coord.lat && coord.lng));
      } catch (error) {
        console.error('Invalid boundary coordinates format:', error);
      }
    }
  }, [boundaryCoordinates]);

  // Map load callback
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    
    // Fit map to show property and boundary if available
    if (boundaryPath.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      boundaryPath.forEach(coord => bounds.extend(coord));
      map.fitBounds(bounds);
    }
  }, [boundaryPath]);

  // Map unmount callback
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Polygon options
  const polygonOptions: google.maps.PolygonOptions = {
    fillColor: boundaryVerified ? '#22c55e' : '#f59e0b',
    fillOpacity: 0.3,
    strokeColor: boundaryVerified ? '#16a34a' : '#d97706',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    clickable: interactive,
  };

  // Format boundary marked date
  const formatBoundaryDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle map error
  if (loadError) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="flex items-center justify-center p-6" style={{ height }}>
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Unable to load map</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (!isLoaded) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="flex items-center justify-center p-6" style={{ height }}>
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const MapComponent = () => (
    <div className="relative w-full" style={{ height }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={boundaryPath.length > 0 ? 18 : 15}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: !interactive,
          zoomControl: interactive,
          streetViewControl: false,
          mapTypeControl: interactive,
          fullscreenControl: false,
        }}
      >
        {/* Property location marker */}
        <Marker
          position={center}
          icon={{
            url: '/images/icons/property-marker.svg',
            scaledSize: new window.google.maps.Size(30, 30),
          }}
          onClick={() => setShowInfoWindow(true)}
        />

        {/* Boundary polygon */}
        {boundaryPath.length > 0 && (
          <Polygon
            paths={boundaryPath}
            options={polygonOptions}
            onClick={() => interactive && setShowInfoWindow(true)}
          />
        )}

        {/* Info window */}
        {showInfoWindow && (
          <InfoWindow
            position={center}
            onCloseClick={() => setShowInfoWindow(false)}
          >
            <div className="p-2 max-w-xs">
              <h4 className="font-semibold mb-2">Property Boundary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={boundaryVerified ? 'default' : 'secondary'}
                    className={cn(
                      'text-xs',
                      boundaryVerified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    )}
                  >
                    {boundaryVerified ? (
                      <>
                        <Verified className="w-3 h-3 mr-1" />
                        Verified
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Unverified
                      </>
                    )}
                  </Badge>
                </div>
                {boundaryMarkedAt && (
                  <p className="text-gray-600">
                    Marked: {formatBoundaryDate(boundaryMarkedAt)}
                  </p>
                )}
                {boundaryMarkedBy && (
                  <p className="text-gray-600">
                    By: Agent ID {boundaryMarkedBy}
                  </p>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Fullscreen toggle */}
      {showFullscreenOption && (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2 bg-white shadow-md"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl w-full h-[80vh]">
            <DialogHeader>
              <DialogTitle>Property Boundary Map</DialogTitle>
            </DialogHeader>
            <div className="flex-1">
              <PropertyBoundaryMap
                {...{
                  propertyId,
                  gpsCoordinates,
                  boundaryCoordinates,
                  boundaryVerified,
                  boundaryMarkedBy,
                  boundaryMarkedAt,
                  boundaryImages,
                  height: '100%',
                  showFullscreenOption: false,
                  showBoundaryInfo: false,
                  interactive: true,
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Map legend */}
      <div className="absolute bottom-2 left-2 bg-white rounded-lg shadow-md p-2 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 bg-green-500 rounded-sm opacity-60"></div>
          <span>Verified Boundary</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-sm opacity-60"></div>
          <span>Unverified Boundary</span>
        </div>
      </div>
    </div>
  );

  return (
    <Card className={cn('w-full overflow-hidden', className)}>
      {showBoundaryInfo && (boundaryCoordinates || boundaryVerified) && (
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-sm">Property Boundary</span>
              </div>
              <Badge
                variant={boundaryVerified ? 'default' : 'secondary'}
                className={cn(
                  boundaryVerified
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                )}
              >
                {boundaryVerified ? (
                  <>
                    <Verified className="w-3 h-3 mr-1" />
                    Verified
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Pending Verification
                  </>
                )}
              </Badge>
            </div>
            
            {boundaryMarkedAt && (
              <span className="text-xs text-gray-600">
                Marked {formatBoundaryDate(boundaryMarkedAt)}
              </span>
            )}
          </div>
          
          {!boundaryVerified && (
            <div className="mt-2 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-600">
                This boundary is pending verification by our team. The actual property boundaries may differ.
              </p>
            </div>
          )}
        </div>
      )}
      
      <CardContent className="p-0">
        <MapComponent />
      </CardContent>
    </Card>
  );
};

export default PropertyBoundaryMap;