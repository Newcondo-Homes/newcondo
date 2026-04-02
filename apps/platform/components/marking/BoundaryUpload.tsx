// apps/platform/components/marking/BoundaryUpload.tsx
"use client";

import { useState, useCallback } from "react";
import { GoogleMap, Polygon, Marker } from "@react-google-maps/api";
import { Button } from "@newcondo/ui/components/button";
import { Card } from "@newcondo/ui/components/card";
import { Badge } from "@newcondo/ui/components/badge";
import { MapPin, Trash2, Undo, Save, AlertCircle } from "lucide-react";

interface BoundaryUploadProps {
  jobId: string;
  onBoundaryComplete: (data: any) => void;
  initialData?: any;
}

const mapContainerStyle = {
  width: "100%",
  height: "500px",
};

const defaultCenter = {
  lat: 6.5244,
  lng: 3.3792,
};

export function BoundaryUpload({
  jobId,
  onBoundaryComplete,
  initialData,
}: BoundaryUploadProps) {
  const [points, setPoints] = useState<google.maps.LatLngLiteral[]>(
    initialData?.coordinates || []
  );
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isDrawing, setIsDrawing] = useState(true);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!isDrawing || !e.latLng) return;

      const newPoint = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };

      setPoints((prev) => [...prev, newPoint]);
    },
    [isDrawing]
  );

  const removeLastPoint = () => {
    setPoints((prev) => prev.slice(0, -1));
  };

  const clearAll = () => {
    setPoints([]);
    setIsDrawing(true);
  };

  const calculateArea = (coords: google.maps.LatLngLiteral[]) => {
    if (coords.length < 3) return 0;
    
    // Simple polygon area calculation (approximate)
    let area = 0;
    for (let i = 0; i < coords.length; i++) {
      const j = (i + 1) % coords.length;
      area += coords[i].lat * coords[j].lng;
      area -= coords[j].lat * coords[i].lng;
    }
    return Math.abs(area / 2) * 111320 * 111320; // Convert to square meters
  };

  const handleSave = () => {
    if (points.length < 3) {
      alert("Please mark at least 3 points to define the boundary");
      return;
    }

    const area = calculateArea(points);
    const boundaryData = {
      coordinates: points,
      area: area,
      timestamp: new Date().toISOString(),
    };

    onBoundaryComplete(boundaryData);
  };

  const polygonOptions = {
    fillColor: "#2196F3",
    fillOpacity: 0.3,
    strokeColor: "#2196F3",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    clickable: false,
    draggable: false,
    editable: false,
    geodesic: false,
    zIndex: 1,
  };

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="p-4 flex gap-3">
          <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div className="text-sm space-y-2">
            <p className="font-semibold text-blue-900">How to Mark Boundaries</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>Click on the map to place markers at property corners</li>
              <li>Place at least 3 points to create a boundary</li>
              <li>The polygon will automatically close</li>
              <li>Use satellite view for better accuracy</li>
              <li>Click "Save Boundary" when done</li>
            </ol>
          </div>
        </div>
      </Card>

      {/* Status Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={isDrawing ? "default" : "secondary"}>
            {isDrawing ? "Drawing Mode" : "Preview Mode"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {points.length} point{points.length !== 1 ? "s" : ""} marked
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={removeLastPoint}
            disabled={points.length === 0}
          >
            <Undo className="h-4 w-4 mr-1" />
            Undo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            disabled={points.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Map */}
      <div className="border rounded-lg overflow-hidden">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={points[0] || defaultCenter}
          zoom={18}
          mapTypeId="satellite"
          onClick={handleMapClick}
          onLoad={onLoad}
          options={{
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
          }}
        >
          {/* Markers */}
          {points.map((point, index) => (
            <Marker
              key={index}
              position={point}
              label={{
                text: `${index + 1}`,
                color: "white",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            />
          ))}

          {/* Polygon */}
          {points.length >= 3 && (
            <Polygon paths={points} options={polygonOptions} />
          )}
        </GoogleMap>
      </div>

      {/* Validation */}
      {points.length < 3 && points.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              Please mark at least {3 - points.length} more point{3 - points.length !== 1 ? "s" : ""} to complete the boundary
            </p>
          </div>
        </Card>
      )}

      {/* Area Info */}
      {points.length >= 3 && (
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Approximate Area</span>
              <span className="font-semibold">
                {calculateArea(points).toFixed(2)} m²
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Save Button */}
      <Button
        className="w-full"
        size="lg"
        onClick={handleSave}
        disabled={points.length < 3}
      >
        <Save className="h-4 w-4 mr-2" />
        Save Boundary ({points.length} points)
      </Button>
    </div>
  );
}