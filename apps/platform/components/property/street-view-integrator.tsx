'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@newcondo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Move, 
  ZoomIn, 
  ZoomOut,
  Navigation,
  Camera,
  MapPin,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreetViewIntegratorProps {
  position: { lat: number; lng: number };
  onPositionChange?: (position: { lat: number; lng: number }) => void;
  onStreetViewReady?: (streetView: google.maps.StreetViewPanorama) => void;
  className?: string;
  height?: number;
  showControls?: boolean;
  enableDragging?: boolean;
}

export default function StreetViewIntegrator({
  position,
  onPositionChange,
  onStreetViewReady,
  className,
  height = 400,
  showControls = true,
  enableDragging = true
}: StreetViewIntegratorProps) {
  const [isStreetViewAvailable, setIsStreetViewAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [streetViewVisible, setStreetViewVisible] = useState(false);
  const [currentHeading, setCurrentHeading] = useState(0);
  const [currentPitch, setCurrentPitch] = useState(0);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  const streetViewRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  // Initialize Street View
  useEffect(() => {
    if (!streetViewRef.current || !window.google) return;

    const initializeStreetView = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Create Street View service to check availability
        const streetViewService = new google.maps.StreetViewService();
        
        // Check if Street View is available at this location
        streetViewService.getPanorama({
          location: position,
          radius: 100,
          source: google.maps.StreetViewSource.OUTDOOR
        }, (result, status) => {
          if (status === google.maps.StreetViewStatus.OK && result) {
            setIsStreetViewAvailable(true);
            
            // Create the Street View panorama
            const panorama = new google.maps.StreetViewPanorama(
              streetViewRef.current!,
              {
                position: result.location?.latLng || position,
                pov: {
                  heading: 0,
                  pitch: 0
                },
                zoom: 1,
                visible: false,
                enableCloseButton: false,
                addressControl: false,
                panControl: showControls,
                zoomControl: showControls,
                fullscreenControl: showControls,
                motionTracking: false,
                motionTrackingControl: false
              }
            );

            panoramaRef.current = panorama;

            // Set up event listeners
            panorama.addListener('position_changed', () => {
              const newPosition = panorama.getPosition();
              if (newPosition && onPositionChange) {
                onPositionChange({
                  lat: newPosition.lat(),
                  lng: newPosition.lng()
                });
              }
            });

            panorama.addListener('pov_changed', () => {
              const pov = panorama.getPov();
              setCurrentHeading(pov.heading || 0);
              setCurrentPitch(pov.pitch || 0);
            });

            panorama.addListener('zoom_changed', () => {
              setCurrentZoom(panorama.getZoom() || 1);
            });

            if (onStreetViewReady) {
              onStreetViewReady(panorama);
            }
          } else {
            setIsStreetViewAvailable(false);
            setError('Street View is not available at this location. Try moving the marker to a nearby road.');
          }
          setIsLoading(false);
        });
      } catch (err) {
        setError('Failed to initialize Street View');
        setIsLoading(false);
      }
    };

    initializeStreetView();
  }, [position, onPositionChange, onStreetViewReady, showControls]);

  // Update Street View position when position prop changes
  useEffect(() => {
    if (panoramaRef.current && isStreetViewAvailable) {
      panoramaRef.current.setPosition(position);
    }
  }, [position, isStreetViewAvailable]);

  // Handle Street View visibility
  useEffect(() => {
    if (panoramaRef.current) {
      panoramaRef.current.setVisible(streetViewVisible);
    }
  }, [streetViewVisible]);

  const toggleStreetView = useCallback(() => {
    if (isStreetViewAvailable) {
      setStreetViewVisible(!streetViewVisible);
    }
  }, [isStreetViewAvailable, streetViewVisible]);

  const resetView = useCallback(() => {
    if (panoramaRef.current) {
      panoramaRef.current.setPov({
        heading: 0,
        pitch: 0
      });
      panoramaRef.current.setZoom(1);
    }
  }, []);

  const adjustHeading = useCallback((delta: number) => {
    if (panoramaRef.current) {
      const currentPov = panoramaRef.current.getPov();
      panoramaRef.current.setPov({
        heading: (currentPov.heading || 0) + delta,
        pitch: currentPov.pitch || 0
      });
    }
  }, []);

  const adjustPitch = useCallback((delta: number) => {
    if (panoramaRef.current) {
      const currentPov = panoramaRef.current.getPov();
      panoramaRef.current.setPov({
        heading: currentPov.heading || 0,
        pitch: Math.max(-90, Math.min(90, (currentPov.pitch || 0) + delta))
      });
    }
  }, []);

  const adjustZoom = useCallback((delta: number) => {
    if (panoramaRef.current) {
      const newZoom = Math.max(0, Math.min(3, currentZoom + delta));
      panoramaRef.current.setZoom(newZoom);
    }
  }, [currentZoom]);

  const goToPosition = useCallback((newPosition: { lat: number; lng: number }) => {
    if (panoramaRef.current) {
      panoramaRef.current.setPosition(newPosition);
    }
  }, []);

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading Street View...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isStreetViewAvailable) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Street View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              Street View is not available at this exact location. This might be because:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>The location is not near a public road</li>
                <li>Street View imagery hasn't been captured here</li>
                <li>The area has restricted access</li>
              </ul>
              Try adjusting the property location marker to a nearby road.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Street View
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleStreetView}
              className="flex items-center gap-2"
            >
              {streetViewVisible ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Show
                </>
              )}
            </Button>
            {streetViewVisible && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetView}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="relative">
          <div
            ref={streetViewRef}
            style={{ height: `${height}px` }}
            className={cn(
              "w-full rounded-lg overflow-hidden border",
              !streetViewVisible && "hidden"
            )}
          />
          
          {!streetViewVisible && (
            <div 
              className="w-full rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center"
              style={{ height: `${height}px` }}
            >
              <div className="text-center">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Click "Show" to view Street View</p>
                <p className="text-sm text-gray-500 mt-1">
                  Use Street View to verify property location and surroundings
                </p>
              </div>
            </div>
          )}
        </div>

        {streetViewVisible && showControls && (
          <div className="mt-4 space-y-4">
            {/* Manual Controls */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">View Direction</label>
                <div className="grid grid-cols-3 gap-1">
                  <div></div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustPitch(15)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <div></div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustHeading(-15)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetView}
                  >
                    <Navigation className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustHeading(15)}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <div></div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustPitch(-15)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <div></div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Zoom Control</label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustZoom(-0.5)}
                    disabled={currentZoom <= 0}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 text-center text-sm">
                    {currentZoom.toFixed(1)}x
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustZoom(0.5)}
                    disabled={currentZoom >= 3}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Current View Info */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-sm font-medium mb-2">Current View</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Heading:</span>
                  <div className="font-mono">{Math.round(currentHeading)}°</div>
                </div>
                <div>
                  <span className="text-gray-600">Pitch:</span>
                  <div className="font-mono">{Math.round(currentPitch)}°</div>
                </div>
                <div>
                  <span className="text-gray-600">Zoom:</span>
                  <div className="font-mono">{currentZoom.toFixed(1)}x</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPosition(position)}
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Go to Property
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetView}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset View
              </Button>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Tips</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use Street View to verify the property's street-facing appearance</li>
                <li>• Look for distinguishing features like gates, colors, or architectural details</li>
                <li>• Check if the property boundary matches what you see in Street View</li>
                <li>• Move along the street to get different angles of the property</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}