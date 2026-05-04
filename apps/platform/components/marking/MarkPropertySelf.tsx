// apps/platform/components/marking/MarkPropertySelf.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { GoogleMap, StreetViewPanorama, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Button } from '@newcondo/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@newcondo/ui/components/tabs';
import { AlertCircle, MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useUpload } from '@/hooks/useUpload';
import { useMarkProperty } from '@/hooks/useProperties';
import { toast } from '@newcondo/ui';
import Image from 'next/image';

interface MarkPropertySelfProps {
  propertyId: string;
  propertyAddress: string;
  initialLat?: number;
  initialLng?: number;
  onMarked?: (boundaryData: BoundaryData) => void;
  onCancel?: () => void;
}

interface BoundaryData {
  coordinates: google.maps.LatLng[];
  center: { lat: number; lng: number };
  polygon: google.maps.Polygon | google.maps.Rectangle | null;
  area: number;
  images: string[];
}

interface DrawingState {
  isDrawing: boolean;
  coordinates: google.maps.LatLng[];
  polygon: google.maps.Polygon | google.maps.Rectangle | null;
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const MARKING_FEE = 20000; // ₦20,000

export function MarkPropertySelf({
  propertyId,
  propertyAddress,
  initialLat,
  initialLng,
  onMarked,
  onCancel,
}: MarkPropertySelfProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['drawing', 'geometry'],
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const streetViewRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);

  const [drawing, setDrawing] = useState<DrawingState>({
    isDrawing: false,
    coordinates: [],
    polygon: null,
  });

  const [mapCenter, setMapCenter] = useState({
    lat: initialLat || 6.5244,
    lng: initialLng || 3.3792,
  });

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [markingImages, setMarkingImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('satellite');
  const [boundaryArea, setBoundaryArea] = useState(0);

  const { uploadFile } = useUpload();
  const { mutateAsync: markProperty } = useMarkProperty();

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setMapCenter({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Unable to get your location. Please enable location services.');
        }
      );
    }
  }, []);

  // Initialize Drawing Manager
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
          google.maps.drawing.OverlayType.POLYGON,
          google.maps.drawing.OverlayType.RECTANGLE,
        ],
      },
      polygonOptions: {
        clickable: true,
        draggable: true,
        editable: true,
        fillColor: '#FF0000',
        fillOpacity: 0.35,
        strokeColor: '#FF0000',
        strokeWeight: 2,
      },
      rectangleOptions: {
        clickable: true,
        draggable: true,
        editable: true,
        fillColor: '#FF0000',
        fillOpacity: 0.35,
        strokeColor: '#FF0000',
        strokeWeight: 2,
      },
    });

    drawingManager.setMap(mapRef.current);
    drawingManagerRef.current = drawingManager;

    // Listen for polygon complete
    google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
      const path = polygon.getPath();
      const coords = path.getArray();
      const area = google.maps.geometry.spherical.computeArea(path);

      setDrawing({
        isDrawing: true,
        coordinates: coords,
        polygon: polygon,
      });

      setBoundaryArea(area);
      drawingManager.setDrawingMode(null);

      toast.success('Property boundary marked! Review and adjust if needed.');
    });

    // Listen for rectangle complete
    google.maps.event.addListener(drawingManager, 'rectanglecomplete', (rectangle: google.maps.Rectangle) => {
      rectangle.setEditable(true);

      const bounds = rectangle.getBounds();
      if (bounds) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();

        const coords = [
          new google.maps.LatLng(ne.lat(), ne.lng()),
          new google.maps.LatLng(ne.lat(), sw.lng()),
          new google.maps.LatLng(sw.lat(), sw.lng()),
          new google.maps.LatLng(sw.lat(), ne.lng()),
        ];

        const area = google.maps.geometry.spherical.computeArea(coords);

        setDrawing({
          isDrawing: true,
          coordinates: coords,
          polygon: rectangle,
        });

        setBoundaryArea(area);
      }

      drawingManager.setDrawingMode(null);
    });

    return () => {
      google.maps.event.clearListeners(drawingManager, 'polygoncomplete');
      google.maps.event.clearListeners(drawingManager, 'rectanglecomplete');
    };
  }, [isLoaded]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    if (markingImages.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const url = await uploadFile(formData);
        setMarkingImages((prev) => [...prev, url]);
      }
      toast.success('Images uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload images');
      console.error(error);
    }
  };

  const handleRemoveImage = (index: number) => {
    setMarkingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearBoundary = () => {
    if (drawing.polygon) {
      drawing.polygon.setMap(null);
    }
    setDrawing({
      isDrawing: false,
      coordinates: [],
      polygon: null,
    });
    setBoundaryArea(0);
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    }
  };

  const handleSubmitMarking = async () => {
    if (!drawing.isDrawing || drawing.coordinates.length === 0) {
      toast.error('Please mark your property boundary first');
      return;
    }

    if (markingImages.length === 0) {
      toast.error('Please upload at least one marking image');
      return;
    }

    setIsSubmitting(true);

    try {
      const coordinates = drawing.coordinates.map((coord) => ({
        lat: coord.lat(),
        lng: coord.lng(),
      }));

      const center = drawing.coordinates.length > 0
        ? {
          lat: drawing.coordinates.reduce((sum, c) => sum + c.lat(), 0) / drawing.coordinates.length,
          lng: drawing.coordinates.reduce((sum, c) => sum + c.lng(), 0) / drawing.coordinates.length,
        }
        : mapCenter;

      const boundaryData: BoundaryData = {
        coordinates: drawing.coordinates,
        center,
        polygon: drawing.polygon,
        area: boundaryArea,
        images: markingImages,
      };


      await markProperty({
        propertyId,
        data: {
          boundaryCoordinates: coordinates,
          boundaryImages: markingImages,
          boundaryVerified: true,
          boundaryMarkedAt: new Date(),
        },
      });




      toast.success('Property marked successfully!');
      onMarked?.(boundaryData);
    } catch (error) {
      toast.error('Failed to submit property marking');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading map...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mark Your Property</CardTitle>
        <CardDescription>
          Draw a boundary around your property on the map to verify its location
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Location Info */}
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-1">{propertyAddress}</p>
            {userLocation && (
              <p className="text-sm text-muted-foreground">
                Your current location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </p>
            )}
          </AlertDescription>
        </Alert>

        {/* Instructions */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <p className="font-medium mb-2">How to mark your property:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Switch between Satellite and Street View for better visibility</li>
              <li>Draw a polygon or rectangle around your property</li>
              <li>The boundary must clearly cover your entire property</li>
              <li>Upload photos showing the property entrance and key areas</li>
              <li>Review and submit when satisfied</li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* Map Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="satellite">Satellite View</TabsTrigger>
            <TabsTrigger value="street">Street View</TabsTrigger>
          </TabsList>

          <TabsContent value="satellite" className="space-y-4">
            <div className="border rounded-lg overflow-hidden h-96">
              <GoogleMap
                // ref={mapRef}
                onLoad={(map) => { mapRef.current = map; }}
                zoom={18}
                center={mapCenter}
                mapTypeId={google.maps.MapTypeId.SATELLITE}
                options={{
                  fullscreenControl: true,
                  mapTypeControl: false,
                  zoomControl: true,
                }}
              >
                {userLocation && (
                  <Marker
                    position={userLocation}
                    title="Your Location"
                  />
                )}
              </GoogleMap>
            </div>
          </TabsContent>

          <TabsContent value="street" className="space-y-4">
            <div className="border rounded-lg overflow-hidden h-96">
              <StreetViewPanorama
                // ref={streetViewRef}
                onLoad={(sv) => { streetViewRef.current = sv; }}
                options={{
                  position: mapCenter,
                  fullscreenControl: true,
                  zoomControl: true,
                }}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Boundary Status */}
        {drawing.isDrawing && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              <p className="font-medium">Boundary marked successfully!</p>
              <p className="text-sm mt-1">
                Area: {(boundaryArea / 1_000_000).toFixed(2)} km² | Coordinates: {drawing.coordinates.length}
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Image Upload */}
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Upload Marking Photos</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Upload photos of your property entrance and key areas ({markingImages.length}/5)
            </p>
            <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-primary rounded-lg cursor-pointer bg-primary/5 hover:bg-primary/10 transition">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isSubmitting}
              />
              <span className="text-primary font-medium">Click to upload images</span>
            </label>
          </div>

          {/* Image Preview */}
          {markingImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {markingImages.map((url, idx) => (
                <div key={idx} className="relative w-full h-24">
                  <Image
                    src={url}
                    alt={`Marking ${idx + 1}`}
                    fill
                    className="object-cover rounded border"
                  />
                  <button
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                    disabled={isSubmitting}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Marking Fee Info */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">Marking Fee: ₦{MARKING_FEE.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">
              By marking your property yourself, you avoid the agent fee.
            </p>
          </AlertDescription>
        </Alert>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClearBoundary}
            disabled={!drawing.isDrawing || isSubmitting}
          >
            Clear Boundary
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitMarking}
            disabled={!drawing.isDrawing || markingImages.length === 0 || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Marking'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}