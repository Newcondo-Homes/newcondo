// apps/platform/components/property/boundary-validator.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, Polygon, Marker } from '@react-google-maps/api';
import { Button } from '@newcondo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { Badge } from '@newcondo/ui/components/badge';
import { MapPin, AlertTriangle, Check, X } from 'lucide-react';
import { useBoundaryMarking } from '@/hooks/useBoundaryMarking';

interface BoundaryValidatorProps {
  coordinates: google.maps.LatLngLiteral[];
  center: google.maps.LatLngLiteral;
  onValidation: (isValid: boolean, errors: string[]) => void;
  propertyId?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  overlaps: OverlapInfo[];
}

interface OverlapInfo {
  propertyId: string;
  overlapPercentage: number;
  ownerName: string;
  propertyTitle: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: true,
  mapTypeId: 'satellite' as google.maps.MapTypeId,
  zoom: 20
};


const calculatePolygonArea = (coords: google.maps.LatLngLiteral[]): number => {
  if (coords.length < 3) return 0;

  let area = 0;
  const earthRadius = 6371000; // Earth's radius in meters

  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const lat1 = coords[i].lat * Math.PI / 180;
    const lat2 = coords[j].lat * Math.PI / 180;
    const deltaLng = (coords[j].lng - coords[i].lng) * Math.PI / 180;

    area += deltaLng * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = Math.abs(area) * earthRadius * earthRadius / 2;
  return area; // Returns area in square meters
};

const calculatePolygonPerimeter = (coords: google.maps.LatLngLiteral[]): number => {
  if (coords.length < 2) return 0;

  let perimeter = 0;

  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    perimeter += getDistance(coords[i], coords[j]);
  }

  return perimeter;
};

const getDistance = (point1: google.maps.LatLngLiteral, point2: google.maps.LatLngLiteral): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const hasSelfintersection = (coords: google.maps.LatLngLiteral[]): boolean => {
  for (let i = 0; i < coords.length; i++) {
    for (let j = i + 2; j < coords.length; j++) {
      if (j === coords.length - 1 && i === 0) continue;

      const line1 = {
        start: coords[i],
        end: coords[(i + 1) % coords.length]
      };

      const line2 = {
        start: coords[j],
        end: coords[(j + 1) % coords.length]
      };

      if (linesIntersect(line1.start, line1.end, line2.start, line2.end)) {
        return true;
      }
    }
  }
  return false;
};

const linesIntersect = (
  p1: google.maps.LatLngLiteral,
  p2: google.maps.LatLngLiteral,
  p3: google.maps.LatLngLiteral,
  p4: google.maps.LatLngLiteral
): boolean => {
  const denominator = (p4.lng - p3.lng) * (p2.lat - p1.lat) - (p4.lat - p3.lat) * (p2.lng - p1.lng);
  if (denominator === 0) return false;

  const ua = ((p4.lat - p3.lat) * (p1.lng - p3.lng) - (p4.lng - p3.lng) * (p1.lat - p3.lat)) / denominator;
  const ub = ((p2.lat - p1.lat) * (p1.lng - p3.lng) - (p2.lng - p1.lng) * (p1.lat - p3.lat)) / denominator;

  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
};

const formatArea = (area: number): string => {
  if (area < 1000) {
    return `${area.toFixed(1)} sqm`;
  } else if (area < 10000) {
    return `${(area / 1000).toFixed(2)} hectares`;
  } else {
    return `${(area / 10000).toFixed(2)} hectares`;
  }
};


export default function BoundaryValidator({
  coordinates,
  center,
  onValidation,
  // propertyId
}: BoundaryValidatorProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { checkOverlaps } = useBoundaryMarking();


  const validateBoundaryShape = useCallback(async () => {
    setIsValidating(true);

    try {
      const area = calculatePolygonArea(coordinates);
      const overlaps = await checkOverlaps(coordinates);

      const errors: string[] = [];
      const warnings: string[] = [];

      if (area < 50) errors.push('Property boundary is too small (minimum 50 sqm)');
      if (area > 50000) errors.push('Property boundary is too large (maximum 5 hectares)');
      if (coordinates.length < 3) errors.push('Property boundary must have at least 3 points');
      if (coordinates.length > 50) errors.push('Property boundary has too many points (maximum 50)');
      if (hasSelfintersection(coordinates)) errors.push('Property boundary cannot intersect itself');

      if (overlaps.length > 0) {
        const significantOverlaps = overlaps.filter(o => o.overlapPercentage > 10);
        if (significantOverlaps.length > 0)
          errors.push(`Property boundary overlaps with ${significantOverlaps.length} existing properties`);

        const minorOverlaps = overlaps.filter(o => o.overlapPercentage <= 10);
        if (minorOverlaps.length > 0)
          warnings.push(`Minor overlaps detected with ${minorOverlaps.length} properties`);
      }

      const isValid = errors.length === 0;
      const result: ValidationResult = { isValid, errors, warnings, overlaps };
      setValidationResult(result);
      onValidation(isValid, errors);

    } catch (error) {
      console.error('Boundary validation error:', error);
      const errorResult: ValidationResult = {
        isValid: false,
        errors: ['Failed to validate boundary. Please try again.'],
        warnings: [],
        overlaps: []
      };
      setValidationResult(errorResult);
      onValidation(false, errorResult.errors);
    } finally {
      setIsValidating(false);
    }
  }, [coordinates, checkOverlaps, onValidation]); // all external values it closes over

  useEffect(() => {
    if (coordinates.length >= 3) {
      validateBoundaryShape();
    }
  }, [coordinates, validateBoundaryShape]); // now complete

  const getValidationStatusColor = (): 'secondary' | 'destructive' | 'default' => {
    if (!validationResult) return 'secondary';
    if (validationResult.isValid) return 'default'; // 'success' doesn't exist in your Badge
    return 'destructive';
  };

  const getValidationStatusIcon = () => {
    if (!validationResult) return <MapPin className="h-4 w-4" />;
    if (validationResult.isValid) return <Check className="h-4 w-4" />;
    return <X className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Boundary Validation</CardTitle>
            <Badge variant={getValidationStatusColor()}>
              {getValidationStatusIcon()}
              {isValidating ? 'Validating...' : validationResult?.isValid ? 'Valid' : 'Invalid'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Map Display */}
            <div className="rounded-lg overflow-hidden border">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                options={mapOptions}
              >
                {coordinates.length >= 3 && (
                  <Polygon
                    paths={coordinates}
                    options={{
                      fillColor: validationResult?.isValid ? '#22c55e' : '#ef4444',
                      fillOpacity: 0.2,
                      strokeColor: validationResult?.isValid ? '#16a34a' : '#dc2626',
                      strokeOpacity: 0.8,
                      strokeWeight: 2
                    }}
                  />
                )}

                {/* Show overlapping properties */}
                {validationResult?.overlaps.map((overlap, index) => (
                  <Polygon
                    key={index}
                    paths={coordinates} // This would need actual overlap coordinates
                    options={{
                      fillColor: '#dc2626',
                      fillOpacity: 0.1,
                      strokeColor: '#dc2626',
                      strokeOpacity: 0.6,
                      strokeWeight: 1,
                    }}
                  />
                ))}

                <Marker position={center} />
              </GoogleMap>
            </div>

            {/* Validation Results */}
            {validationResult && (
              <div className="space-y-3">
                {/* Errors */}
                {validationResult.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        {validationResult.errors.map((error, index) => (
                          <div key={index}>• {error}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Warnings */}
                {validationResult.warnings.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        {validationResult.warnings.map((warning, index) => (
                          <div key={index}>• {warning}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Overlaps */}
                {validationResult.overlaps.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Overlapping Properties:</h4>
                    {validationResult.overlaps.map((overlap, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{overlap.propertyTitle}</div>
                          <div className="text-xs text-gray-600">Owner: {overlap.ownerName}</div>
                        </div>
                        <Badge variant="destructive">
                          {overlap.overlapPercentage.toFixed(1)}% overlap
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {/* Boundary Statistics */}
                {validationResult.isValid && (
                  <div className="grid grid-cols-2 gap-4 p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium">Area</div>
                      <div className="text-lg">{formatArea(calculatePolygonArea(coordinates))}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Perimeter</div>
                      <div className="text-lg">{calculatePolygonPerimeter(coordinates).toFixed(1)}m</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDetails(!showDetails)}
                size="sm"
              >
                {showDetails ? 'Hide' : 'Show'} Details
              </Button>

              <Button
                onClick={validateBoundaryShape}
                disabled={isValidating || coordinates.length < 3}
                size="sm"
              >
                {isValidating ? 'Validating...' : 'Revalidate'}
              </Button>
            </div>

            {/* Detailed Information */}
            {showDetails && validationResult && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="space-y-2 text-sm">
                  <div>Points: {coordinates.length}</div>
                  <div>Area: {formatArea(calculatePolygonArea(coordinates))}</div>
                  <div>Perimeter: {calculatePolygonPerimeter(coordinates).toFixed(1)}m</div>
                  <div>Status: {validationResult.isValid ? 'Valid' : 'Invalid'}</div>
                  <div>Overlaps: {validationResult.overlaps.length}</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}