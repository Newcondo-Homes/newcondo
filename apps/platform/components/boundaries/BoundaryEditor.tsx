// apps/platform/components/boundaries/BoundaryEditor.tsx
'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { GoogleMap, Polygon, useJsApiLoader } from '@react-google-maps/api';
import { Save, Trash2, AlertCircle, MapPin } from 'lucide-react';
import { toast } from '@newcondo/ui/';


interface BoundaryEditorProps {
  propertyId: string;
  initialCoordinates?: { lat: number; lng: number }[];
  gpsCoordinates: { lat: number; lng: number };
  onSave: (coordinates: { lat: number; lng: number }[]) => Promise<void>;
  onCancel: () => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '500px',
};

export function BoundaryEditor({
  propertyId,
  initialCoordinates = [],
  gpsCoordinates,
  onSave,
  onCancel,
}: BoundaryEditorProps) {
  const [coordinates, setCoordinates] = useState(initialCoordinates);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['drawing'],
  });

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!isDrawing || !e.latLng) return;

      const newCoord = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };

      setCoordinates((prev) => [...prev, newCoord]);
    },
    [isDrawing]
  );

  const handleStartDrawing = () => {
    setCoordinates([]);
    setIsDrawing(true);
    toast.info('Drawing mode activated', {
      description: 'Click on the map to draw the property boundary',
    });
  };

  const handleCompleteDrawing = () => {
    if (coordinates.length < 3) {
      toast.error('Invalid boundary', {
        description: 'Please draw at least 3 points to create a boundary',
      });
      return;
    }

    setIsDrawing(false);
    toast.success('Boundary drawn', {
      description: 'Review your boundary and save when ready',
    });
  };

  const handleClear = () => {
    setCoordinates([]);
    setIsDrawing(false);
  };

  const handleSave = async () => {
    if (coordinates.length < 3) {
      toast.error('Invalid boundary', {
        description: 'Please draw at least 3 points to create a boundary',
      });
      return;
    }

    try {
      setIsSaving(true);
      await onSave(coordinates);
      toast.success('Boundary saved', {
        description: 'Property boundary has been updated successfully',
      });
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Save failed', {
        description: 'Failed to save property boundary',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="h-[500px] flex items-center justify-center">
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
        <CardTitle>Edit Property Boundary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Click on the map to draw points around your property. Connect at
            least 3 points to create a boundary.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          {!isDrawing ? (
            <Button onClick={handleStartDrawing} variant="default">
              <MapPin className="h-4 w-4 mr-2" />
              Start Drawing
            </Button>
          ) : (
            <Button onClick={handleCompleteDrawing} variant="default">
              Complete Drawing ({coordinates.length} points)
            </Button>
          )}
          <Button onClick={handleClear} variant="outline">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>

        <div className={`rounded-lg overflow-hidden border ${isDrawing ? '[&_.gm-style]:cursor-crosshair' : ''}`}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            mapContainerClassName={isDrawing ? 'cursor-crosshair' : 'cursor-default'}
            center={gpsCoordinates}
            zoom={20}
            mapTypeId="satellite"
            onClick={handleMapClick}
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              streetViewControl: true,
              fullscreenControl: true,
            }}
          >
            {coordinates.length > 0 && (
              <Polygon
                paths={coordinates}
                options={{
                  fillColor: '#3b82f6',
                  fillOpacity: 0.3,
                  strokeColor: '#2563eb',
                  strokeOpacity: 1,
                  strokeWeight: 2,
                  editable: false,
                }}
              />
            )}
          </GoogleMap>
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={onCancel} variant="outline" disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={coordinates.length < 3 || isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Boundary'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}